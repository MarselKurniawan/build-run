import { supabase } from '@/integrations/supabase/client';

// Types
export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  balance: number;
  total_income: number;
  total_recharge: number;
  total_withdraw: number;
  team_income: number;
  rabat_income: number;
  vip_level: number;
  referral_code: string | null;
  referred_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  daily_income: number;
  total_income: number;
  validity: number;
  vip_level: number;
  image: string;
  is_active: boolean;
  created_at: string;
  category: string;
  promo_price: number | null;
  promo_daily_income: number | null;
  promo_validity: number | null;
}

export type ProductCategory = 'reguler' | 'promo' | 'vip';

export interface Investment {
  id: string;
  user_id: string;
  product_id: string | null;
  product_name: string;
  amount: number;
  daily_income: number;
  total_income: number;
  validity: number;
  days_remaining: number;
  total_earned: number;
  status: string;
  last_claimed_at: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  created_at: string;
}

export interface BankAccount {
  id: string;
  user_id: string;
  account_type: string;
  provider: string;
  account_number: string;
  account_name: string;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  is_used: boolean;
  used_by: string | null;
  reward_amount: number | null;
  created_at: string;
  used_at: string | null;
}

// Format currency helper
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Commission rates by tier (on purchase)
// Tier A (VIP 3+) = 10%, Tier B (VIP 2) = 3%, Tier C (VIP 1) = 2%
export const getCommissionRate = (vipLevel: number): number => {
  if (vipLevel >= 3) return 0.10; // Tier A - 10%
  if (vipLevel === 2) return 0.03; // Tier B - 3%
  return 0.02; // Tier C - 2%
};

// Rabat rates by tier (on daily profit)
// Tier A (VIP 3+) = 5%, Tier B (VIP 2) = 3%, Tier C (VIP 1) = 2%
export const getRabatRate = (vipLevel: number): number => {
  if (vipLevel >= 3) return 0.05; // Tier A - 5%
  if (vipLevel === 2) return 0.03; // Tier B - 3%
  return 0.02; // Tier C - 2%
};

// Get tier label based on VIP level
export const getTierLabel = (vipLevel: number): string => {
  if (vipLevel >= 3) return 'A';
  if (vipLevel === 2) return 'B';
  return 'C';
};

// Process referral commission when user invests (via Edge Function to bypass RLS)
export const processReferralCommission = async (userId: string, investAmount: number): Promise<void> => {
  try {
    const { data, error } = await supabase.functions.invoke('process-referral', {
      body: {
        userId,
        amount: investAmount,
        type: 'commission'
      }
    });

    if (error) {
      console.error('Error calling process-referral function:', error);
      return;
    }

    if (data?.reward > 0) {
      console.log(`Commission processed: ${data.reward} for ${data.referrerName}`);
    }
  } catch (error) {
    console.error('Error processing referral commission:', error);
  }
};

// Process rabat when user claims daily income (via Edge Function to bypass RLS)
export const processReferralRabat = async (userId: string, dailyProfit: number): Promise<void> => {
  try {
    const { data, error } = await supabase.functions.invoke('process-referral', {
      body: {
        userId,
        amount: dailyProfit,
        type: 'rabat'
      }
    });

    if (error) {
      console.error('Error calling process-referral function:', error);
      return;
    }

    if (data?.reward > 0) {
      console.log(`Rabat processed: ${data.reward} for ${data.referrerName}`);
    }
  } catch (error) {
    console.error('Error processing referral rabat:', error);
  }
};

// Profile functions
export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
};

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<boolean> => {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating profile:', error);
    return false;
  }
  return true;
};

// Products functions
export const getProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  return data || [];
};

export const getAllProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('price', { ascending: true });

  if (error) {
    console.error('Error fetching all products:', error);
    return [];
  }
  return data || [];
};

// Investment functions
export const getInvestments = async (userId: string): Promise<Investment[]> => {
  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching investments:', error);
    return [];
  }
  return data || [];
};

export const createInvestment = async (investment: Omit<Investment, 'id' | 'created_at' | 'last_claimed_at'>): Promise<Investment | null> => {
  const { data, error } = await supabase
    .from('investments')
    .insert(investment)
    .select()
    .single();

  if (error) {
    console.error('Error creating investment:', error);
    return null;
  }
  return data;
};

export const updateInvestment = async (id: string, updates: Partial<Investment>): Promise<boolean> => {
  const { error } = await supabase
    .from('investments')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating investment:', error);
    return false;
  }
  return true;
};

// Claim ulang otomatis tiap 24 jam dari last_claimed_at (atau created_at jika belum pernah)
export const canClaimToday = (lastClaimedAt: string | null): boolean => {
  return getNextClaimDelayMs(lastClaimedAt) <= 0;
};

export const getNextClaimDelayMs = (lastClaimedAt: string | null): number => {
  if (!lastClaimedAt) return 0;
  const last = new Date(lastClaimedAt).getTime();
  const next = last + 24 * 60 * 60 * 1000;
  return next - Date.now();
};

// Transaction functions
export const getTransactions = async (userId: string): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
  return data || [];
};

export const createTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction | null> => {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transaction)
    .select()
    .single();

  if (error) {
    console.error('Error creating transaction:', error);
    return null;
  }
  return data;
};

export const updateTransactionStatus = async (id: string, status: string): Promise<boolean> => {
  const { error } = await supabase
    .from('transactions')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('Error updating transaction:', error);
    return false;
  }
  return true;
};

// Bank account functions
export const getBankAccounts = async (userId: string): Promise<BankAccount[]> => {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bank accounts:', error);
    return [];
  }
  return data || [];
};

export const createBankAccount = async (account: Omit<BankAccount, 'id' | 'created_at'>): Promise<BankAccount | null> => {
  const { data, error } = await supabase
    .from('bank_accounts')
    .insert(account)
    .select()
    .single();

  if (error) {
    console.error('Error creating bank account:', error);
    return null;
  }
  return data;
};

export const deleteBankAccount = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('bank_accounts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting bank account:', error);
    return false;
  }
  return true;
};

// Coupon functions
export const getCoupons = async (): Promise<Coupon[]> => {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching coupons:', error);
    return [];
  }
  return data || [];
};

export const createCoupon = async (code: string): Promise<Coupon | null> => {
  const { data, error } = await supabase
    .from('coupons')
    .insert({ code })
    .select()
    .single();

  if (error) {
    console.error('Error creating coupon:', error);
    return null;
  }
  return data;
};

export const useCoupon = async (code: string, userId: string): Promise<{ success: boolean; reward?: number; message?: string }> => {
  // Find the coupon
  const { data: coupon, error: findError } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .maybeSingle();

  if (findError || !coupon) {
    return { success: false, message: 'Kode kupon tidak valid' };
  }

  if (coupon.is_used) {
    return { success: false, message: 'Kupon sudah digunakan' };
  }

  // Generate random reward
  const reward = Math.floor(Math.random() * 900) + 100;

  // Update coupon
  const { error: updateError } = await supabase
    .from('coupons')
    .update({
      is_used: true,
      used_by: userId,
      reward_amount: reward,
      used_at: new Date().toISOString(),
    })
    .eq('id', coupon.id);

  if (updateError) {
    return { success: false, message: 'Gagal menggunakan kupon' };
  }

  // Update user balance
  const { data: profile } = await supabase
    .from('profiles')
    .select('balance')
    .eq('user_id', userId)
    .single();

  if (profile) {
    await supabase
      .from('profiles')
      .update({ balance: profile.balance + reward })
      .eq('user_id', userId);
  }

  // Add transaction
  await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      type: 'income',
      amount: reward,
      status: 'success',
      description: `Hadiah kupon: ${code.toUpperCase()}`,
    });

  return { success: true, reward };
};

export const deleteCoupon = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('coupons')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting coupon:', error);
    return false;
  }
  return true;
};

// Admin functions
export const getAllProfiles = async (): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all profiles:', error);
    return [];
  }
  return data || [];
};

export const getAllTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all transactions:', error);
    return [];
  }
  return data || [];
};

export const getAllInvestments = async (): Promise<Investment[]> => {
  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all investments:', error);
    return [];
  }
  return data || [];
};

export const setUserAdmin = async (userId: string, isAdmin: boolean): Promise<boolean> => {
  if (isAdmin) {
    const { error } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role: 'admin' });
    
    if (error) {
      console.error('Error setting admin role:', error);
      return false;
    }
  } else {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', 'admin');
    
    if (error) {
      console.error('Error removing admin role:', error);
      return false;
    }
  }
  return true;
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase.functions.invoke('delete-user', {
    body: { user_id: userId },
  });
  if (error) {
    console.error('Error deleting user:', error);
    return false;
  }
  return data?.success || false;
};

export const getTeamMembers = async (referralCode: string): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('referred_by', referralCode)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching team members:', error);
    return [];
  }
  return data || [];
};

export const getPendingTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending transactions:', error);
    return [];
  }
  return data || [];
};

export const checkIsAdmin = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();

  if (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
  return !!data;
};

// Product admin functions
export const createProduct = async (product: Omit<Product, 'id' | 'created_at'>): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    return null;
  }
  return data;
};

export const updateProduct = async (id: string, updates: Partial<Product>): Promise<boolean> => {
  const { error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating product:', error);
    return false;
  }
  return true;
};

export const deleteProduct = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting product:', error);
    return false;
  }
  return true;
};

// VIP Settings
export interface VipSetting {
  id: string;
  vip_level: number;
  required_members: number;
  updated_at: string;
}

export const getVipSettings = async (): Promise<VipSetting[]> => {
  const { data, error } = await supabase
    .from('vip_settings')
    .select('*')
    .order('vip_level', { ascending: true });

  if (error) {
    console.error('Error fetching VIP settings:', error);
    return [];
  }
  return (data || []) as unknown as VipSetting[];
};

export const updateVipSetting = async (vipLevel: number, requiredMembers: number): Promise<boolean> => {
  const { error } = await supabase
    .from('vip_settings')
    .update({ required_members: requiredMembers, updated_at: new Date().toISOString() } as any)
    .eq('vip_level', vipLevel);

  if (error) {
    console.error('Error updating VIP setting:', error);
    return false;
  }
  return true;
};
