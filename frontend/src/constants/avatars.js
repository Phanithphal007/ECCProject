// Cute Cartoon Student Avatars (DiceBear 9.x Adventurer style)
// High-quality SVG avatars rendered on-the-fly via HTTPS.
// No image files stored locally on project or hosting.

export const CARTOON_AVATAR_PRESETS = [
  // Boys (15 diverse cartoon student avatars)
  { id: 'b1', name: 'Leo', gender: 'boy', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Leo' },
  { id: 'b2', name: 'Oliver', gender: 'boy', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Oliver' },
  { id: 'b3', name: 'Felix', gender: 'boy', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Felix' },
  { id: 'b4', name: 'Lucas', gender: 'boy', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Lucas' },
  { id: 'b5', name: 'Liam', gender: 'boy', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Liam' },
  { id: 'b6', name: 'Noah', gender: 'boy', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Noah' },
  { id: 'b7', name: 'Ethan', gender: 'boy', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Ethan' },
  { id: 'b8', name: 'Mason', gender: 'boy', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Mason' },
  { id: 'b9', name: 'Alexander', gender: 'boy', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Alexander' },
  { id: 'b10', name: 'Henry', gender: 'boy', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Henry' },
  { id: 'b11', name: 'Julian', gender: 'boy', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Julian' },
  { id: 'b12', name: 'Jack', gender: 'boy', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Jack' },
  { id: 'b13', name: 'Samuel', gender: 'boy', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Samuel' },
  { id: 'b14', name: 'Arthur', gender: 'boy', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Arthur' },
  { id: 'b15', name: 'Daniel', gender: 'boy', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Daniel' },

  // Girls (15 diverse cartoon student avatars)
  { id: 'g1', name: 'Mia', gender: 'girl', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Mia' },
  { id: 'g2', name: 'Chloe', gender: 'girl', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Chloe' },
  { id: 'g3', name: 'Zoe', gender: 'girl', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Zoe' },
  { id: 'g4', name: 'Sophia', gender: 'girl', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Sophia' },
  { id: 'g5', name: 'Aria', gender: 'girl', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Aria' },
  { id: 'g6', name: 'Lily', gender: 'girl', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Lily' },
  { id: 'g7', name: 'Emma', gender: 'girl', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Emma' },
  { id: 'g8', name: 'Isabella', gender: 'girl', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Isabella' },
  { id: 'g9', name: 'Amelia', gender: 'girl', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Amelia' },
  { id: 'g10', name: 'Harper', gender: 'girl', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Harper' },
  { id: 'g11', name: 'Evelyn', gender: 'girl', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Evelyn' },
  { id: 'g12', name: 'Hannah', gender: 'girl', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Hannah' },
  { id: 'g13', name: 'Grace', gender: 'girl', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Grace' },
  { id: 'g14', name: 'Ruby', gender: 'girl', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Ruby' },
  { id: 'g15', name: 'Bella', gender: 'girl', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Bella' }
];

// Clean neutral default profile placeholder when no avatar is selected
export const DEFAULT_STUDENT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='24' fill='%23EEF2F6'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%2394A3B8'/%3E%3Cpath d='M22 84c0-15.464 12.536-28 28-28s28 12.536 28 28' fill='%2394A3B8'/%3E%3C/svg%3E";

/**
 * Returns a valid avatar image URL, or the default placeholder when null/empty.
 */
export const getStudentAvatarUrl = (avatar) => {
  if (typeof avatar === 'string' && avatar.trim().length > 0) {
    return avatar.trim();
  }
  return DEFAULT_STUDENT_AVATAR;
};

