// Local demo authentication so the platform works out of the box,
// before any external database credentials are configured.

export type MiklafUser = {
  id: string;
  email: string;
  fullName: string;
  role: "principal" | "counselor" | "teacher" | "admin";
  roleLabel: string;
};

const STORAGE_KEY = "miklaf-auth-session";
const USERS_KEY = "miklaf-demo-users";

type StoredUser = MiklafUser & { password: string };

const seedUsers: StoredUser[] = [
  {
    id: "u-1",
    email: "admin@miklaf.school",
    password: "Pass123456",
    fullName: "محمد العتيبي",
    role: "principal",
    roleLabel: "مدير المدرسة",
  },
  {
    id: "u-2",
    email: "counselor@miklaf.school",
    password: "Pass123456",
    fullName: "عبدالله الشمري",
    role: "counselor",
    roleLabel: "الموجه الطلابي",
  },
];

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return seedUsers;
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    const extra = raw ? (JSON.parse(raw) as StoredUser[]) : [];
    return [...seedUsers, ...extra];
  } catch {
    return seedUsers;
  }
}

function writeExtraUser(user: StoredUser) {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(USERS_KEY);
  const extra = raw ? (JSON.parse(raw) as StoredUser[]) : [];
  window.localStorage.setItem(USERS_KEY, JSON.stringify([...extra, user]));
}

export function getStoredSession(): MiklafUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MiklafUser;
    return parsed?.id ? parsed : null;
  } catch {
    return null;
  }
}

export function persistSession(user: MiklafUser | null) {
  if (typeof window === "undefined") return;
  if (!user) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export async function signIn(email: string, password: string): Promise<MiklafUser> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const found = readUsers().find(
    (user) => user.email.trim().toLowerCase() === email.trim().toLowerCase(),
  );
  if (!found) throw new Error("لا يوجد حساب مسجل بهذا البريد الإلكتروني");
  if (found.password !== password) throw new Error("كلمة المرور غير صحيحة");
  const { password: _password, ...session } = found;
  return session;
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
): Promise<MiklafUser> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  if (password.length < 8) throw new Error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
  const exists = readUsers().some(
    (user) => user.email.trim().toLowerCase() === email.trim().toLowerCase(),
  );
  if (exists) throw new Error("البريد الإلكتروني مسجل مسبقًا");

  const created: StoredUser = {
    id: `u-${Date.now()}`,
    email: email.trim(),
    password,
    fullName,
    role: "teacher",
    roleLabel: "معلم",
  };
  writeExtraUser(created);
  const { password: _password, ...session } = created;
  return session;
}
