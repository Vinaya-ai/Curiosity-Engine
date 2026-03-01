import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  doc,
  type Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export type ContentType =
  | 'video'
  | 'movie'
  | 'pdf'
  | 'podcast'
  | 'project'
  | 'article'
  | 'other';

export interface Item {
  id: string;
  title: string;
  link?: string;
  timeRequired: number;
  energyLevel: 'low' | 'medium' | 'high';
  engagementType: 'passive' | 'active' | 'deep';
  contentType: ContentType;
  completed: boolean;
  createdAt: Timestamp;
}

export async function addItem(
  userId: string,
  item: {
    title: string;
    link?: string;
    timeRequired: number;
    energyLevel: 'low' | 'medium' | 'high';
    engagementType: 'passive' | 'active' | 'deep';
    contentType: ContentType;
  },
): Promise<void> {
  const itemsRef = collection(db, 'users', userId, 'items');
  await addDoc(itemsRef, {
    title: item.title,
    link: item.link || null,
    timeRequired: item.timeRequired,
    energyLevel: item.energyLevel,
    engagementType: item.engagementType,
    contentType: item.contentType,
    completed: false,
    createdAt: serverTimestamp(),
  });
}

export async function getUserItems(userId: string): Promise<Item[]> {
  const itemsRef = collection(db, 'users', userId, 'items');
  const q = query(itemsRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt,
  })) as Item[];
}

export async function toggleItemCompletion(
  userId: string,
  itemId: string,
  completed: boolean,
): Promise<void> {
  const itemRef = doc(db, 'users', userId, 'items', itemId);
  await updateDoc(itemRef, {
    completed,
  });
}
