export interface Book {
  id: string;
  created_at: string;
  title: string;
  author: string | null;
  genre: string | null;
  publish_date: string | null;
  description: string | null;
  condition: string | null;
  price: string | null;
  front_image_url: string;
  back_image_url: string | null;
}

export interface CategoryRow {
  id: string;
  section: string;
  value: string;
}
