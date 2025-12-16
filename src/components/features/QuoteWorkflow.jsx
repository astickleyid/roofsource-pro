import React, { useState } from 'react';
import { Briefcase, Package, CheckCircle, TrendingUp, Plus, X, Camera, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { identifyProduct, findVendorOptions, rankVendors, assembleCompleteQuote } from '../../services/intelligentQuoteBuilder';

export const QuoteWorkflow = ({ projectInfo, onQuoteComplete }) => {
  const [step, setStep] = useState(1); // 1: Job Details, 2: Add Materials, 3: Review & Submit
  const [jobDetails, setJobDetails] = useState({
    name: '',
    location: projectInfo?.loc || '',
    projectType: 'residential',
    urgency: 'normal',
    budget: 'moderate',
    qualityPreference: 'standard',
    deliveryPreference: 'scheduled',
    preferredSuppliers: [],
    notes: ''
  });

  const [materials, setMaterials] = useState([]);
  const [currentMaterial, setCurrentMaterial] = useState({
    photo: null,
    photoPreview: null,
    sku: '',
    name: '',
    description: '',
    quantity: 1
  });

  const [identifiedProduct, setIdentifiedProduct] = useState(null);
  const [identifying, setIdentifying] = useState(false);
  const [addingMaterial, setAddingMaterial] = useState(false);
  
  const [finalQuote, setFinalQuote] = useState(null);
  const [generatingQuote, setGeneratingQuote] = useState(false);

  // Step 1: Job Details Form
  const renderJobDetailsForm = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Briefcase size={32} />
          <h2 className="text-2xl font-bold">New Quote - Job Details</h2>
        </div>
        <p className="text-blue-100">Provide job information to get intelligent vendor recommendations</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Name *
            </label>
            <input
              type="text"
              value={jobDetails.name}
              onChange={(e) => setJobDetails({ ...jobDetails, name: e.target.value })}
              placeholder="e.g., Smith Residence Re-roof"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <input
              type="text"
              value={jobDetails.location}
              onChange={(e) => setJobDetails({ ...jobDetails, location: e.target.value })}
              placeholder="City, State or ZIP"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Type *
            </label>
            <select
              value={jobDetails.projectType}
              onChange={(e) => setJobDetails({ ...jobDetails, projectType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="repair">Repair/Maintenance</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Urgency Level
            </label>
            <select
              value={jobDetails.urgency}
              onChange={(e) => setJobDetails({ ...jobDetails, urgency: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="urgent">Urgent (ASAP)</option>
              <option value="normal">Normal (1-2 weeks)</option>
              <option value="flexible">Flexible (No rush)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget Constraint
            </label>
            <select
              value={jobDetails.budget}
              onChange={(e) => setJobDetails({ ...jobDetails, budget: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="tight">Tight (Price-focused)</option>
              <option value="moderate">Moderate (Balanced)</option>
              <option value="flexible">Flexible (Quality-focused)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quality Preference
            </label>
            <select
              value={jobDetails.qualityPreference}
              onChange={(e) => setJobDetails({ ...jobDetails, qualityPreference: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="economy">Economy</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={jobDetails.notes}
              onChange={(e) => setJobDetails({ ...jobDetails, notes: e.target.value })}
              placeholder="Any special requirements or considerations..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={() => setStep(2)}
            disabled={!jobDetails.name || !jobDetails.location}
            size="lg"
          >
            Next: Add Materials →
          </Button>
        </div>
      </div>
    </div>
  );

  // Step 2: Add Materials with Product Identification
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentMaterial({
          ...currentMaterial,
          photo: file,
          photoPreview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdentifyProduct = async () => {
    if (!currentMaterial.sku && !currentMaterial.name && !currentMaterial.photo) {
      alert('Please provide at least SKU, name, or photo');
      return;
    }

    setIdentifying(true);
    try {
      const result = await identifyProduct(currentMaterial);
      setIdentifiedProduct(result);
    } catch (error) {
      alert('Error identifying product: ' + error.message);
    } finally {
      setIdentifying(false);
    }
  };

  const handleConfirmProduct = () => {
    setMaterials([...materials, {
      ...identifiedProduct,
      quantity: currentMaterial.quantity,
      userInput: { ...currentMaterial }
    }]);
    
    // Reset form
    setCurrentMaterial({
      photo: null,
      photoPreview: null,
      sku: '',
      name: '',
      description: '',
      quantity: 1
    });
    setIdentifiedProduct(null);
    setAddingMaterial(false);
  };

  const renderAddMaterialsStep = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Package size={32} />
          <h2 className="text-2xl font-bold">Add Materials to Quote</h2>
        </div>
        <p className="text-purple-100">
          {jobDetails.name} • {materials.length} material{materials.length !== 1 ? 's' : ''} added
        </p>
      </div>

      {/* Materials List */}
      {materials.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-bold text-lg mb-4">Materials Added ({materials.length})</h3>
          <div className="space-y-3">
            {materials.map((material, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{material.productName}</div>
                  <div className="text-sm text-gray-600">
                    {material.manufacturer} • SKU: {material.sku} • Qty: {material.quantity}
                  </div>
                </div>
                <button
                  onClick={() => setMaterials(materials.filter((_, i) => i !== idx))}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Material Form */}
      {!addingMaterial ? (
        <div className="text-center">
          <Button
            onClick={() => setAddingMaterial(true)}
            icon={Plus}
            size="lg"
          >
            Add Material
          </Button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Identify Product</h3>
            <button
              onClick={() => {
                setAddingMaterial(false);
                setIdentifiedProduct(null);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          {!identifiedProduct ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Photo (Recommended)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {currentMaterial.photoPreview && (
                  <img 
                    src={currentMaterial.photoPreview} 
                    alt="Product" 
                    className="mt-2 w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU / Model Number
                  </label>
                  <input
                    type="text"
                    value={currentMaterial.sku}
                    onChange={(e) => setCurrentMaterial({ ...currentMaterial, sku: e.target.value })}
                    placeholder="e.g., OC-DUR-DRIFT"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={currentMaterial.name}
                    onChange={(e) => setCurrentMaterial({ ...currentMaterial, name: e.target.value })}
                    placeholder="e.g., Duration Shingles"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity Needed
                </label>
                <input
                  type="number"
                  min="1"
                  value={currentMaterial.quantity}
                  onChange={(e) => setCurrentMaterial({ ...currentMaterial, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <Button
                onClick={handleIdentifyProduct}
                disabled={identifying || (!currentMaterial.sku && !currentMaterial.name && !currentMaterial.photo)}
                icon={identifying ? null : Camera}
                className="w-full"
              >
                {identifying ? 'Identifying Product...' : 'Identify Product'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-blue-600 shrink-0 mt-1" size={24} />
                  <div className="flex-1">
                    <h4 className="font-bold text-blue-900 mb-2">Product Identified</h4>
                    <div className="text-sm space-y-1">
                      <div><strong>Product:</strong> {identifiedProduct.productName}</div>
                      <div><strong>Manufacturer:</strong> {identifiedProduct.manufacturer}</div>
                      <div><strong>SKU:</strong> {identifiedProduct.sku}</div>
                      <div><strong>Category:</strong> {identifiedProduct.category}</div>
                      <div><strong>Confidence:</strong> {identifiedProduct.confidence}%</div>
                    </div>
                  </div>
                </div>
              </div>

              {identifiedProduct.confirmationNeeded && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="text-yellow-600 shrink-0" size={18} />
                  <p className="text-sm text-yellow-800">
                    Please verify this is the correct product before proceeding
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIdentifiedProduct(null)}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button
                  onClick={handleConfirmProduct}
                  className="flex-1"
                  icon={CheckCircle}
                >
                  Confirm & Add
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(1)}
        >
          ← Back to Job Details
        </Button>
        <Button
          onClick={() => setStep(3)}
          disabled={materials.length === 0}
          size="lg"
        >
          Generate Quote ({materials.length} material{materials.length !== 1 ? 's' : ''}) →
        </Button>
      </div>
    </div>
  );

  // Step 3: Generate and Review Complete Quote
  const handleGenerateQuote = async () => {
    setGeneratingQuote(true);
    try {
      const quote = await assembleCompleteQuote(jobDetails, materials);
      setFinalQuote(quote);
    } catch (error) {
      alert('Error generating quote: ' + error.message);
    } finally {
      setGeneratingQuote(false);
    }
  };

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp size={32} />
          <h2 className="text-2xl font-bold">Review & Generate Quote</h2>
        </div>
        <p className="text-green-100">{jobDetails.name} • {materials.length} materials ready</p>
      </div>

      {!finalQuote ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <TrendingUp size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Generate Quote</h3>
          <p className="text-gray-600 mb-6">
            Our AI will find the best vendors for each material based on your job requirements
          </p>
          <Button
            onClick={handleGenerateQuote}
            disabled={generatingQuote}
            size="lg"
            icon={TrendingUp}
          >
            {generatingQuote ? 'Analyzing Vendors...' : 'Generate Intelligent Quote'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Quote Summary */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-bold text-lg mb-4">Quote Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Total Cost</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${finalQuote.summary.totalCost.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Estimated Savings</div>
                <div className="text-2xl font-bold text-green-600">
                  ${finalQuote.summary.estimatedSavings.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Avg. Delivery</div>
                <div className="text-2xl font-bold text-gray-900">
                  {finalQuote.summary.averageDeliveryDays} days
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Suppliers</div>
                <div className="text-2xl font-bold text-gray-900">
                  {finalQuote.summary.suppliersUsed}
                </div>
              </div>
            </div>
          </div>

          {/* Materials with Best Vendors */}
          {finalQuote.materials.map((item, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-bold text-lg text-gray-900">{item.identifiedProduct.productName}</h4>
                  <p className="text-sm text-gray-600">{item.identifiedProduct.manufacturer} • SKU: {item.identifiedProduct.sku}</p>
                </div>
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                  Score: {item.bestVendor.intelligenceScore}/100
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="text-green-600" size={20} />
                      <span className="font-bold text-green-900">Best Choice: {item.bestVendor.supplierName}</span>
                    </div>
                    <div className="text-sm text-green-800">
                      {item.bestVendor.recommendation.text}
                    </div>
                    <ul className="mt-2 space-y-1">
                      {item.bestVendor.recommendation.reasons.map((reason, i) => (
                        <li key={i} className="text-sm text-green-700">✓ {reason}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Factor Breakdown */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(item.bestVendor.factors).map(([name, factor]) => (
                      factor.details && (
                        <div key={name} className="bg-gray-50 p-2 rounded">
                          <div className="font-medium text-gray-700 capitalize">{name}</div>
                          <div className="text-gray-600">{factor.details}</div>
                        </div>
                      )
                    ))}
                  </div>
                </div>

                <div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-2">Pricing</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Unit Price:</span>
                        <span className="font-medium">${item.bestVendor.unitPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quantity:</span>
                        <span className="font-medium">{item.material.quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span className="font-medium">${item.bestVendor.shippingCost.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-gray-300 pt-1 mt-1 flex justify-between font-bold">
                        <span>Total:</span>
                        <span className="text-green-600">${item.bestVendor.totalCost.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
            >
              ← Edit Materials
            </Button>
            <Button
              onClick={() => onQuoteComplete && onQuoteComplete(finalQuote)}
              size="lg"
            >
              Accept Quote & Create Project
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  // Main Render
  return (
    <div className="w-full">
      {/* Progress Steps */}
      <div className="mb-6 flex items-center justify-center gap-4">
        {[
          { num: 1, label: 'Job Details' },
          { num: 2, label: 'Add Materials' },
          { num: 3, label: 'Generate Quote' }
        ].map((s, idx) => (
          <React.Fragment key={s.num}>
            <div className={`flex items-center gap-2 ${step >= s.num ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step >= s.num ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                {s.num}
              </div>
              <span className="font-medium hidden sm:inline">{s.label}</span>
            </div>
            {idx < 2 && <div className={`w-12 h-0.5 ${step > s.num ? 'bg-blue-600' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      {step === 1 && renderJobDetailsForm()}
      {step === 2 && renderAddMaterialsStep()}
      {step === 3 && renderReviewStep()}
    </div>
  );
};
