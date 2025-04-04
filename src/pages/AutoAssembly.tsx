
// This function ensures we don't set an empty value to our filters object
const handleFilterChange = (field: string, value: string) => {
  // If value is empty string, set it to a non-empty default value
  if (field === 'warehouse' || field === 'cargoType' || field === 'category') {
    setFilters(prev => ({
      ...prev,
      [field]: value === '' ? 'all' : value
    }));
  } else {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  }
};

// Update initial state of filters to use 'all' instead of empty string
const [filters, setFilters] = useState({
  warehouse: 'all',
  cargoType: 'all',
  search: '',
  sortBy: 'createdAt',
  sortDirection: 'desc' as 'asc' | 'desc',
  category: 'all'
});
