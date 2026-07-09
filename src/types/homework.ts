export interface HomeworkSourceItem {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  done: boolean;
}

export interface HomeworkItem extends HomeworkSourceItem {
  lessonId: string;
}
