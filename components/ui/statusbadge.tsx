const StatusBadge = ({ status }: { status: string }) => {
    const getStatusStyle = (status: string) => {
      switch (status) {
        case 'accepted':
          return 'bg-green-100 text-green-800 border-green-300';
        case 'rejected':
          return 'bg-red-100 text-red-800 border-red-300';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-300';
      }
    };
  
    const getStatusText = (status: string) => {
      switch (status) {
        case 'accepted': return 'Acceptée';
        case 'rejected': return 'Refusée';
        case 'pending': return 'En attente';
        default: return status;
      }
    };
  
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusStyle(status)}`}>
        {getStatusText(status)}
      </span>
    );
  };
  
  export default StatusBadge;
  