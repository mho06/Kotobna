create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  title text not null,
  author text,
  genre text,
  publish_date text,
  description text,
  condition text,
  price text,
  front_image_url text,
  back_image_url text
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  section text not null,
  value text not null,
  unique (section, value)
);

alter table books enable row level security;
alter table categories enable row level security;

create policy "Public read access" on books for select using (true);
create policy "Public read access" on categories for select using (true);
