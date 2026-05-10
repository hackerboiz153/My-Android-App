/*
  # Create tasks table

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key, auto-generated)
      - `title` (text, not null) - The task title
      - `description` (text, default empty) - Optional task description
      - `completed` (boolean, default false) - Whether the task is done
      - `priority` (text, default 'medium') - Task priority: low, medium, or high
      - `created_at` (timestamptz, default now()) - When the task was created

  2. Security
    - Enable RLS on `tasks` table
    - Add policy allowing anyone to read all tasks (public read for demo)
    - Add policy allowing anyone to insert tasks
    - Add policy allowing anyone to update tasks
    - Add policy allowing anyone to delete tasks

  3. Notes
    - This is a simple demo app with open access for demonstration purposes
    - In production, policies should restrict access to authenticated users only
*/

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  completed boolean DEFAULT false,
  priority text DEFAULT 'medium',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tasks"
  ON tasks FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert tasks"
  ON tasks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update tasks"
  ON tasks FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete tasks"
  ON tasks FOR DELETE
  TO anon, authenticated
  USING (true);
