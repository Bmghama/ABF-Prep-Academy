
import { UserProfile } from '../types';
import { supabase } from './supabaseClient';

// STORAGE KEYS
const SESSION_KEY = 'abf_session_v3_prod';

// UTILS
const generateId = () => Math.random().toString(36).substr(2, 9);
const hashPassword = (pwd: string) => `hashed_${pwd}_salt_MALI_SECURE_2024`; 

// VALIDATORS
export const validateEmail = (email: string) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
};

export const validatePhone = (phone: string) => {
  // Accepte +223 suivi de 8 chiffres (standard Mali) ou format local 8 chiffres
  const clean = phone.replace(/\s/g, '');
  return /^\+223\d{8}$/.test(clean) || /^\d{8}$/.test(clean);
};

export const validatePassword = (pwd: string) => {
  return pwd && pwd.length >= 6;
};

// SERVICE
export const authService = {
  getSession: (): UserProfile | null => {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch (e) { return null; }
  },

  updateUser: async (user: UserProfile) => {
    // 1. Update local session
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    
    // 2. Persist to DB (Real or Mock)
    try {
      await supabase.from('users').upsert(user);
    } catch (e) {
      console.error("Sync error", e);
    }
  },

  getAllUsers: async (): Promise<UserProfile[]> => {
    // Fetch users for leaderboard
    const { data } = await supabase.from('users').select('*').order('xp', { ascending: false }).limit(50);
    return (data as UserProfile[]) || [];
  },

  register: async (userData: { name: string, identifier: string, password: string }): Promise<{success: boolean, message?: string, user?: UserProfile}> => {
    try {
        const { name, identifier, password } = userData;

        // Validation
        if (!name || name.trim().length < 2) return { success: false, message: "Nom complet requis." };
        if (!password || !validatePassword(password)) return { success: false, message: "Mot de passe trop court (min 6 caractères)." };

        const cleanIdentifier = identifier.trim();
        const isEmail = validateEmail(cleanIdentifier);
        const isPhone = validatePhone(cleanIdentifier);

        if (!isEmail && !isPhone) return { success: false, message: "Email ou Téléphone (+223) invalide." };

        // Check duplicates via Supabase
        const { data: existingUser } = await supabase.from('users').select('*').eq(isEmail ? 'email' : 'phone', cleanIdentifier).single();
        if (existingUser) return { success: false, message: "Compte déjà existant." };

        // Create Auth User
        const { error: authError } = await supabase.auth.signUp({
            email: isEmail ? cleanIdentifier : undefined,
            phone: isPhone ? cleanIdentifier : undefined,
            password: password
        });

        if (authError && !authError.message.includes("mock")) { 
            // In hybrid mode, we might ignore auth errors if it's purely DB based for now
            // But if real client is connected, this is important.
            // console.warn("Auth warning:", authError); 
        }

        // Create Profile
        const newUser: UserProfile = {
          id: generateId(),
          name: name.trim(),
          email: isEmail ? cleanIdentifier : '',
          phone: isPhone ? cleanIdentifier : '',
          passwordHash: hashPassword(password), // Legacy fallback
          isPremium: false,
          xp: 100,
          level: 1,
          rankIndex: 0,
          jobTitle: 'Stagiaire Virtuel',
          employmentStatus: 'CHÔMAGE',
          virtualWallet: 50000,
          virtualSalary: 0,
          badges: ['BIENVENUE'],
          createdAt: Date.now(),
          lastActive: Date.now(),
          careerStats: { 
            complianceScore: 50, customerScore: 50, technicalScore: 50, 
            stressManagement: 50, tasksCompleted: 0, promotionsEarned: 0, interviewsPassed: 0
          },
          inventory: [],
          certificates: [],
          unlockedCourses: [],
          forumReputation: 0
        };

        // Save to DB
        await supabase.from('users').insert(newUser);
        
        // Save Session
        localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));

        return { success: true, user: newUser };
    } catch (error: any) {
        return { success: false, message: error.message || "Erreur système." };
    }
  },

  login: async (identifier: string, password: string): Promise<{success: boolean, message?: string, user?: UserProfile}> => {
    try {
        const cleanIdentifier = identifier.trim();
        const isEmail = validateEmail(cleanIdentifier);

        // 1. Try Supabase Auth Login
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: isEmail ? cleanIdentifier : undefined,
            phone: !isEmail ? cleanIdentifier : undefined,
            password: password
        });

        // 2. Fetch User Profile from DB
        // We query by email or phone.
        const { data: userProfile } = await supabase.from('users')
            .select('*')
            .eq(isEmail ? 'email' : 'phone', cleanIdentifier)
            .single();

        if (!userProfile) return { success: false, message: "Utilisateur introuvable." };

        // Check password hash if auth backend didn't handle it (Mock mode fallback)
        if (userProfile.passwordHash !== hashPassword(password)) {
             return { success: false, message: "Mot de passe incorrect." };
        }

        // Success
        const updatedUser = { ...userProfile, lastActive: Date.now() };
        await authService.updateUser(updatedUser); // Updates session and DB
        
        return { success: true, user: updatedUser };

    } catch (error) {
        return { success: false, message: "Erreur de connexion." };
    }
  },

  logout: () => {
    supabase.auth.signOut();
    localStorage.removeItem(SESSION_KEY);
  }
};
