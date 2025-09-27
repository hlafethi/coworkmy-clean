ALTER TABLE time_slots
ADD CONSTRAINT time_slots_space_label_unique UNIQUE (space_id, label); 