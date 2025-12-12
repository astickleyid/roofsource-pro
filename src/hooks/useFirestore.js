import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

export const useFirestoreCollection = (collectionName, queryConstraints = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const collectionRef = collection(db, collectionName);
    const q = queryConstraints.length > 0 
      ? query(collectionRef, ...queryConstraints) 
      : collectionRef;

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setData(docs);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [collectionName, JSON.stringify(queryConstraints)]);

  return { data, loading, error };
};

export const useProjectData = (projectId) => {
  const { user } = useAuth();
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !projectId) {
      setLoading(false);
      return;
    }

    const projectRef = doc(db, 'projects', projectId);
    const scopeRef = collection(db, 'projects', projectId, 'scope');
    const vendorsRef = collection(db, 'vendors');
    const userVendorsQuery = query(vendorsRef, where('userId', '==', user.uid));

    const unsubscribers = [];

    const unsubProject = onSnapshot(
      projectRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setProjectData(prev => ({
            ...prev,
            info: { id: snapshot.id, ...snapshot.data() }
          }));
        }
      },
      (err) => setError(err.message)
    );
    unsubscribers.push(unsubProject);

    const unsubScope = onSnapshot(
      scopeRef,
      (snapshot) => {
        const scope = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProjectData(prev => ({ ...prev, scope }));
        setLoading(false);
      },
      (err) => setError(err.message)
    );
    unsubscribers.push(unsubScope);

    const unsubVendors = onSnapshot(
      userVendorsQuery,
      (snapshot) => {
        const vendors = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProjectData(prev => ({ ...prev, vendors }));
      },
      (err) => setError(err.message)
    );
    unsubscribers.push(unsubVendors);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user, projectId]);

  const updateProject = async (updates) => {
    if (!projectId) return;
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, { ...updates, updatedAt: serverTimestamp() });
  };

  const addScopeItem = async (item) => {
    if (!projectId) return;
    const scopeRef = collection(db, 'projects', projectId, 'scope');
    await addDoc(scopeRef, { ...item, createdAt: serverTimestamp() });
  };

  const updateScopeItem = async (itemId, updates) => {
    if (!projectId) return;
    const itemRef = doc(db, 'projects', projectId, 'scope', itemId);
    await updateDoc(itemRef, updates);
  };

  const deleteScopeItem = async (itemId) => {
    if (!projectId) return;
    const itemRef = doc(db, 'projects', projectId, 'scope', itemId);
    await deleteDoc(itemRef);
  };

  const addVendor = async (vendor) => {
    if (!user) return;
    const vendorsRef = collection(db, 'vendors');
    await addDoc(vendorsRef, { 
      ...vendor, 
      userId: user.uid,
      createdAt: serverTimestamp() 
    });
  };

  const updateVendor = async (vendorId, updates) => {
    const vendorRef = doc(db, 'vendors', vendorId);
    await updateDoc(vendorRef, updates);
  };

  const deleteVendor = async (vendorId) => {
    const vendorRef = doc(db, 'vendors', vendorId);
    await deleteDoc(vendorRef);
  };

  return {
    projectData,
    loading,
    error,
    updateProject,
    addScopeItem,
    updateScopeItem,
    deleteScopeItem,
    addVendor,
    updateVendor,
    deleteVendor
  };
};
