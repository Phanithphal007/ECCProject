/**
 * Static Mock Users Data
 * Role-based authentication demonstration accounts.
 */
export const mockUsers = [
  {
    id: "USR-ADMIN-01",
    email: "admin@ecc.edu.kh",
    phone: "+855 12 888 999",
    password: "admin",
    name: "Sophea Heng",
    khmerName: "ហេង សុភា",
    role: "admin",
    roleLabel: "Academic Director",
    title: "ECC Academic Director & Administrator",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    badge: "Center Admin"
  },
  {
    id: "USR-PARENT-01",
    email: "parent@gmail.com",
    phone: "+855 17 889 001",
    password: "parent",
    name: "Kalyan Meas",
    khmerName: "ម៉ាស កល្យាណ",
    role: "parent",
    roleLabel: "Parent / Guardian",
    title: "Guardian of Dara Sok & Bopha Sok",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    badge: "Verified Guardian",
    linkedChildrenIds: ["STU-1020", "STU-1021"],
    linkedChildrenNames: ["Dara Sok", "Bopha Sok"]
  },
  {
    id: "STU-1020",
    studentId: "STU-1020",
    email: "student@ecc.edu.kh",
    phone: "+855 17 889 001",
    password: "student",
    name: "Dara Sok",
    khmerName: "សុខ ដារ៉ា",
    role: "student",
    roleLabel: "Student (Child)",
    title: "Grade 5 Primary English Learner",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    badge: "Active Learner",
    grade: "Grade 5",
    currentClassId: "CLS-G1-ALP",
    currentClassName: "Grade 1 Alphabet Starters",
    parentId: "USR-PARENT-01",
    guardianName: "Kalyan Meas"
  },
  {
    id: "USR-GENERAL-01",
    email: "user@gmail.com",
    phone: "+855 11 223 344",
    password: "user",
    name: "Visal Chan",
    khmerName: "ចាន់ វិសាល",
    role: "user",
    roleLabel: "General User",
    title: "Public Inquirer / Prospective Parent",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    badge: "Prospective Visitor"
  }
];

