export interface LessonPhotoObject {
  src: string;
  caption?: string;
  alt?: string;
}

export type LessonPhoto = string | LessonPhotoObject;

export interface Lesson {
  id: string;
  title: string;
  date: string;
  summary: string;
  notes: string;
  photos: LessonPhoto[];
}
