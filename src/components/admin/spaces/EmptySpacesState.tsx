


interface EmptySpacesStateProps {
  loading: boolean;
}

export const EmptySpacesState = ({ loading }: EmptySpacesStateProps) => {
  if (loading) {
    return <p className="text-center py-4">Chargement des espaces...</p>;
  }
  
  return <p className="text-center py-4">Aucun espace trouvé.</p>;
};
