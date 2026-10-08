import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  updatePassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, testConnection } from '../firebase/config';
import { UserProfile, UserRole, Anggota } from '../types';
import { fetchAnggota, logActivity, saveUserProfile } from '../services/db';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  anggotaProfile: Anggota | null;
  role: UserRole;
  loading: boolean;
  isAdmin: boolean;
  isAnggota: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmailOrNip: (identifier: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (newPass: string) => Promise<void>;
  demoLoginAsAdmin: () => Promise<void>;
  demoLoginAsAnggota: (nip?: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  updateProfileName: (newName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPERADMIN_EMAIL = 'asepf16@guru.smp.belajar.id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [anggotaProfile, setAnggotaProfile] = useState<Anggota | null>(null);
  const [loading, setLoading] = useState(true);

  // Check connection on boot
  useEffect(() => {
    testConnection();
  }, []);

  const loadUserProfile = async (fbUser: FirebaseUser) => {
    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userDocRef);

      let profile: UserProfile;

      if (userSnap.exists()) {
        profile = userSnap.data() as UserProfile;
        const isSuper = fbUser.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();
        // Update to Imas Komariah if this is the admin account and has old/original Google name
        if (isSuper || profile.role === 'admin') {
          if (profile.nama !== 'Imas Komariah' && (profile.nama.toLowerCase().includes('asep') || !profile.nama)) {
            profile.nama = 'Imas Komariah';
            await setDoc(
              userDocRef,
              { ...profile, nama: 'Imas Komariah', updatedAt: new Date().toISOString() },
              { merge: true }
            );
          }
        }
      } else {
        // First-time setup: Check if superadmin
        const isSuper = fbUser.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();
        profile = {
          uid: fbUser.uid,
          nama: isSuper ? 'Imas Komariah' : fbUser.displayName || 'Pengguna MKPS',
          email: fbUser.email || '',
          role: isSuper ? 'admin' : 'anggota',
          status: 'aktif',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, profile);

        // Also add to admins collection if superadmin
        if (isSuper) {
          await setDoc(doc(db, 'admins', fbUser.uid), {
            email: fbUser.email,
            role: 'admin',
            createdAt: new Date().toISOString(),
          });
        }
      }

      setUserProfile(profile);

      // If role is anggota, find corresponding anggota record by email or NIP
      if (profile.role === 'anggota' || profile.anggotaId) {
        const members = await fetchAnggota();
        const matched = members.find(
          (m) =>
            m.id === profile.anggotaId ||
            (profile.email && m.email?.toLowerCase() === profile.email.toLowerCase())
        );
        if (matched) {
          setAnggotaProfile(matched);
          if (!profile.anggotaId) {
            profile.anggotaId = matched.id;
            await saveUserProfile(profile);
          }
        }
      } else {
        setAnggotaProfile(null);
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadUserProfile(user);
      } else {
        setUserProfile(null);
        setAnggotaProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUserProfile = async () => {
    if (currentUser) {
      await loadUserProfile(currentUser);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await logActivity({
          userId: result.user.uid,
          namaUser: result.user.displayName || result.user.email || 'Google User',
          role: result.user.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase() ? 'admin' : 'anggota',
          aktivitas: 'Login Akun Google',
          modul: 'Autentikasi',
          detail: `User login melalui Google OAuth: ${result.user.email}`,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmailOrNip = async (identifier: string, pass: string) => {
    setLoading(true);
    try {
      let emailToUse = identifier.trim();

      // If user typed NIP (only numbers)
      if (/^\d+$/.test(emailToUse)) {
        // Match NIP with registered Anggota to get email
        const members = await fetchAnggota();
        const matched = members.find((m) => m.nip === emailToUse);
        if (matched && matched.email) {
          emailToUse = matched.email;
        } else {
          // Standard pattern for members without explicit email
          emailToUse = `nip_${emailToUse}@mkps-garut.sch.id`;
        }
      }

      const res = await signInWithEmailAndPassword(auth, emailToUse, pass);
      if (res.user) {
        await logActivity({
          userId: res.user.uid,
          namaUser: res.user.displayName || res.user.email || identifier,
          role: 'anggota',
          aktivitas: 'Login Email / NIP',
          modul: 'Autentikasi',
          detail: `User login menggunakan NIP/Email: ${identifier}`,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const demoLoginAsAdmin = async () => {
    setLoading(true);
    // Simulating quick admin profile for seamless preview
    const dummyAdmin: UserProfile = {
      uid: 'admin-demo-mkps',
      nama: 'Imas Komariah',
      email: SUPERADMIN_EMAIL,
      role: 'admin',
      status: 'aktif',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setUserProfile(dummyAdmin);
    setAnggotaProfile(null);
    setLoading(false);
  };

  const updateProfileName = async (newName: string) => {
    if (!userProfile) return;
    const updated = { ...userProfile, nama: newName, updatedAt: new Date().toISOString() };
    setUserProfile(updated);
    if (currentUser) {
      await setDoc(doc(db, 'users', currentUser.uid), updated, { merge: true });
    }
  };

  const demoLoginAsAnggota = async (nip = '196803151994121002') => {
    setLoading(true);
    const members = await fetchAnggota();
    const matched = members.find((m) => m.nip === nip) || members[0];
    const dummyUser: UserProfile = {
      uid: matched ? `user-${matched.id}` : 'anggota-demo-mkps',
      nama: matched ? matched.nama : 'Drs. H. Dedi Suryadi, M.Pd.',
      email: matched?.email || 'dedi.suryadi@mkps-garut.id',
      role: 'anggota',
      anggotaId: matched?.id,
      status: 'aktif',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setUserProfile(dummyUser);
    setAnggotaProfile(matched || null);
    setLoading(false);
  };

  const logout = async () => {
    if (userProfile) {
      await logActivity({
        userId: userProfile.uid,
        namaUser: userProfile.nama,
        role: userProfile.role,
        aktivitas: 'Logout',
        modul: 'Autentikasi',
        detail: `Pengguna keluar dari sistem`,
      });
    }
    await signOut(auth);
    setUserProfile(null);
    setAnggotaProfile(null);
  };

  const changePassword = async (newPass: string) => {
    if (!currentUser) throw new Error('Tidak ada sesi login pengguna');
    await updatePassword(currentUser, newPass);
  };

  const role: UserRole = userProfile?.role || 'anggota';
  const isAdmin = role === 'admin';
  const isAnggota = role === 'anggota';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        anggotaProfile,
        role,
        loading,
        isAdmin,
        isAnggota,
        loginWithGoogle,
        loginWithEmailOrNip,
        logout,
        changePassword,
        demoLoginAsAdmin,
        demoLoginAsAnggota,
        refreshUserProfile,
        updateProfileName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
