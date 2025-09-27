-- Créer la fonction pour ajouter les colonnes
create or replace function add_profile_columns(columns text[])
returns void
language plpgsql
security definer
as $$
declare
  col text;
begin
  foreach col in array columns
  loop
    execute format('alter table profiles add column if not exists %I text', col);
  end loop;
end;
$$;

-- Donner les permissions nécessaires
grant execute on function add_profile_columns(text[]) to authenticated;
grant execute on function add_profile_columns(text[]) to service_role;

-- Créer l'index sur la colonne city
create index if not exists idx_profiles_city on profiles(city);

-- Mettre à jour le trigger updated_at
create or replace function handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on profiles;
create trigger set_updated_at
  before update on profiles
  for each row
  execute function handle_updated_at(); 