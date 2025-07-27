import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Collapse,
  Container, 
  Divider,
  FormControl,
  Grid, 
  IconButton, 
  InputAdornment, 
  InputLabel,
  Menu,
  MenuItem,
  Paper, 
  Stack,
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Tabs, 
  Tab,
  TextField, 
  ToggleButton, 
  ToggleButtonGroup, 
  Tooltip, 
  Typography, 
  useMediaQuery,
  useTheme,
  CircularProgress,
  Chip,
  Select
} from '@mui/material';
import { 
  Payments as PaymentsIcon,
  MenuBook as EbookIcon,
  Telegram as TelegramIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Search as SearchIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  HighlightOff as HighlightOffIcon,
  FileDownload as FileDownloadIcon,
  Sort as SortIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { 
  getAnalyticsSummary, 
  getPaymentAnalytics, 
  getEbookAccessData, 
  getEnhancedTelegramSubscriptions,
  type AnalyticsSummary,
  type PaymentWithAccessStatus,
  type EnhancedTelegramSubscription
} from '../services/analyticsApi';
import { EbookAccess } from '../types';

// Helper function to format date to 12-hour format
const formatDateTo12Hour = (dateString: string | undefined) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy h:mm a');
  } catch (error) {
    return 'Invalid Date';
  }
};

// Format currency
const formatCurrency = (amount: number, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
};

// Format phone number
const formatPhone = (phone: number | string | null | undefined) => {
  if (!phone) return 'N/A';
  const phoneStr = String(phone);
  if (phoneStr.length === 12 && phoneStr.startsWith('91')) {
    return `+${phoneStr.slice(0, 2)} ${phoneStr.slice(2, 7)} ${phoneStr.slice(7)}`;
  }
  return phoneStr;
};

// Type for sort configuration
type SortConfig = {
  field: string;
  direction: 'asc' | 'desc';
};

// Filter types for advanced filtering
type DateRangeFilter = {
  startDate: string | null;
  endDate: string | null;
};

type PaymentFilter = {
  product: string;
  minAmount: number | '';
  maxAmount: number | '';
  status: string;
  hasAccess: string;
  dateRange: DateRangeFilter;
};

type EbookFilter = {
  ebook: string;
  hasAccess: string;
  dateRange: DateRangeFilter;
};

type TelegramFilter = {
  plan: string;
  hasPayment: string;
  dateRange: DateRangeFilter;
};

const AnalyticsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = useState<number>(0);
  const [payments, setPayments] = useState<PaymentWithAccessStatus[]>([]);
  const [ebookAccesses, setEbookAccesses] = useState<EbookAccess[]>([]);
  const [telegramSubscriptions, setTelegramSubscriptions] = useState<EnhancedTelegramSubscription[]>([]);
  const [showExpired, setShowExpired] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: '', direction: 'asc' });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [sortMenuTab, setSortMenuTab] = useState<number>(0); // Which tab's sort menu is open
  
  // Advanced filter state
  const [showFilters, setShowFilters] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>({
    product: '',
    minAmount: '',
    maxAmount: '',
    status: '',
    hasAccess: '',
    dateRange: { startDate: null, endDate: null }
  });
  const [ebookFilter, setEbookFilter] = useState<EbookFilter>({
    ebook: '',
    hasAccess: '',
    dateRange: { startDate: null, endDate: null }
  });
  const [telegramFilter, setTelegramFilter] = useState<TelegramFilter>({
    plan: '',
    hasPayment: '',
    dateRange: { startDate: null, endDate: null }
  });
  
  // Unique values for filter dropdowns
  const [uniqueProducts, setUniqueProducts] = useState<string[]>([]);
  const [uniqueEbooks, setUniqueEbooks] = useState<string[]>([]);
  const [uniquePlans, setUniquePlans] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [paymentsData, ebookData, telegramData, summaryData] = await Promise.all([
          getPaymentAnalytics(),
          getEbookAccessData(),
          getEnhancedTelegramSubscriptions(),
          getAnalyticsSummary()
        ]);
        
        setPayments(paymentsData);
        setEbookAccesses(ebookData);
        setTelegramSubscriptions(telegramData);
        setSummary(summaryData);
        
        // Extract unique values for filter dropdowns
        const products = Array.from(new Set(paymentsData.map(p => p.product || 'Unknown')));
        const ebooks = Array.from(new Set(ebookData.map(e => e.ebook || 'Unknown')));
        const plans = Array.from(new Set(telegramData
          .filter(t => t.plan_name)
          .map(t => t.plan_name || 'Unknown')));
          
        setUniqueProducts(products);
        setUniqueEbooks(ebooks);
        setUniquePlans(plans);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Advanced filter functions
  const toggleFilters = () => {
    setShowFilters(prev => !prev);
  };
  
  const resetFilters = () => {
    setShowFilters(false);
    setPaymentFilter({
      product: '',
      minAmount: '',
      maxAmount: '',
      status: '',
      hasAccess: '',
      dateRange: { startDate: null, endDate: null }
    });
    setEbookFilter({
      ebook: '',
      hasAccess: '',
      dateRange: { startDate: null, endDate: null }
    });
    setTelegramFilter({
      plan: '',
      hasPayment: '',
      dateRange: { startDate: null, endDate: null }
    });
  };
  
  // Payment filter handlers
  const handlePaymentFilterChange = (field: keyof Omit<PaymentFilter, 'dateRange'>, value: any) => {
    setPaymentFilter(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handlePaymentDateChange = (field: keyof DateRangeFilter, value: string | null) => {
    setPaymentFilter(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value
      }
    }));
  };
  
  // Ebook filter handlers
  const handleEbookFilterChange = (field: keyof Omit<EbookFilter, 'dateRange'>, value: any) => {
    setEbookFilter(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleEbookDateChange = (field: keyof DateRangeFilter, value: string | null) => {
    setEbookFilter(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value
      }
    }));
  };
  
  // Telegram filter handlers
  const handleTelegramFilterChange = (field: keyof Omit<TelegramFilter, 'dateRange'>, value: any) => {
    setTelegramFilter(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleTelegramDateChange = (field: keyof DateRangeFilter, value: string | null) => {
    setTelegramFilter(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value
      }
    }));
  };

  // Filter and sort data based on search term, filters, and sort config
  const filterAndSortData = <T extends Record<string, any>>(data: T[], searchableFields: string[]) => {
    // First apply advanced filters based on active tab
    let filteredData = data;
    
    if (activeTab === 0) { // Payments tab
      if (paymentFilter.product) {
        filteredData = filteredData.filter(item => item.product === paymentFilter.product);
      }
      
      if (paymentFilter.minAmount !== '') {
        filteredData = filteredData.filter(item => item.amount >= Number(paymentFilter.minAmount));
      }
      
      if (paymentFilter.maxAmount !== '') {
        filteredData = filteredData.filter(item => item.amount <= Number(paymentFilter.maxAmount));
      }
      
      if (paymentFilter.hasAccess) {
        filteredData = filteredData.filter(item => 
          paymentFilter.hasAccess === 'yes' ? item.hasAccess : !item.hasAccess
        );
      }
      
      if (paymentFilter.dateRange.startDate) {
        const startDate = new Date(paymentFilter.dateRange.startDate);
        filteredData = filteredData.filter(item => new Date(item.created_at) >= startDate);
      }
      
      if (paymentFilter.dateRange.endDate) {
        const endDate = new Date(paymentFilter.dateRange.endDate);
        endDate.setHours(23, 59, 59, 999); // End of day
        filteredData = filteredData.filter(item => new Date(item.created_at) <= endDate);
      }
    } else if (activeTab === 1) { // Ebook tab
      if (ebookFilter.ebook) {
        filteredData = filteredData.filter(item => item.ebook === ebookFilter.ebook);
      }
      
      if (ebookFilter.hasAccess) {
        filteredData = filteredData.filter(item => 
          ebookFilter.hasAccess === 'yes' ? item.access : !item.access
        );
      }
      
      if (ebookFilter.dateRange.startDate) {
        const startDate = new Date(ebookFilter.dateRange.startDate);
        filteredData = filteredData.filter(item => new Date(item.created_at) >= startDate);
      }
      
      if (ebookFilter.dateRange.endDate) {
        const endDate = new Date(ebookFilter.dateRange.endDate);
        endDate.setHours(23, 59, 59, 999); // End of day
        filteredData = filteredData.filter(item => new Date(item.created_at) <= endDate);
      }
    } else if (activeTab === 2) { // Telegram tab
      if (telegramFilter.plan) {
        filteredData = filteredData.filter(item => item.plan_name === telegramFilter.plan);
      }
      
      if (telegramFilter.hasPayment) {
        filteredData = filteredData.filter(item => 
          telegramFilter.hasPayment === 'yes' ? item.hasPayment : !item.hasPayment
        );
      }
      
      if (telegramFilter.dateRange.startDate) {
        const startDate = new Date(telegramFilter.dateRange.startDate);
        // For telegram, check both start_date and expiry_date
        filteredData = filteredData.filter(item => 
          (item.start_date && new Date(item.start_date) >= startDate) || 
          (item.expiry_date && new Date(item.expiry_date) >= startDate)
        );
      }
      
      if (telegramFilter.dateRange.endDate) {
        const endDate = new Date(telegramFilter.dateRange.endDate);
        endDate.setHours(23, 59, 59, 999); // End of day
        filteredData = filteredData.filter(item => 
          (item.start_date && new Date(item.start_date) <= endDate) || 
          (item.expiry_date && new Date(item.expiry_date) <= endDate)
        );
      }
    }
    
    // Then filter by search term
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filteredData = filteredData.filter(item => {
        return searchableFields.some(field => {
          const value = item[field];
          return value && value.toString().toLowerCase().includes(lowerCaseSearchTerm);
        });
      });
    }
    
    // Then sort if a sort config is set
    if (sortConfig.field) {
      filteredData = [...filteredData].sort((a, b) => {
        const aValue = a[sortConfig.field];
        const bValue = b[sortConfig.field];
        
        // Handle different data types
        if (aValue === null || aValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bValue === null || bValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
        
        // Handle date fields
        if (sortConfig.field.includes('date') || sortConfig.field === 'created_at' || sortConfig.field === 'expiry_date' || sortConfig.field === 'start_date') {
          const dateA = new Date(aValue).getTime();
          const dateB = new Date(bValue).getTime();
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
        
        // Handle boolean fields
        if (typeof aValue === 'boolean') {
          return sortConfig.direction === 'asc' 
            ? (aValue === bValue ? 0 : aValue ? 1 : -1)
            : (aValue === bValue ? 0 : aValue ? -1 : 1);
        }
        
        // Handle numeric fields
        if (typeof aValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // Default string comparison
        return sortConfig.direction === 'asc'
          ? aValue.toString().localeCompare(bValue.toString())
          : bValue.toString().localeCompare(aValue.toString());
      });
    }
    
    return filteredData;
  };

  // Helper to get nested object values using dot notation
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  // Filtered and sorted data sets
  const filteredPayments = filterAndSortData(payments, ['email', 'phone', 'product', 'razorpay_order_id']);
  const filteredEbookAccesses = filterAndSortData(ebookAccesses, ['user_email', 'user_name', 'payment_id']);
  
  // First filter by status, then apply search and sort
  const filteredTelegramSubscriptions = useMemo(() => {
    let statusFiltered;
    if (showExpired) {
      statusFiltered = telegramSubscriptions.filter(sub => sub.status === 'expired');
    } else if (showPending) {
      statusFiltered = telegramSubscriptions.filter(sub => sub.status === 'pending');
    } else {
      statusFiltered = telegramSubscriptions.filter(sub => sub.status === 'active');
    }
    
    return filterAndSortData(statusFiltered, ['customer_name', 'telegram_username', 'email', 'phone_number']);
  }, [showExpired, showPending, telegramSubscriptions, searchTerm, sortConfig, filterAndSortData]);
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    // Reset sort when changing tabs
    setSortConfig({ field: '', direction: 'asc' });
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  // Sort menu handlers
  const handleSortClick = (event: React.MouseEvent<HTMLButtonElement>, tabIndex: number) => {
    setAnchorEl(event.currentTarget);
    setSortMenuTab(tabIndex);
  };
  
  const handleSortClose = () => {
    setAnchorEl(null);
  };
  
  const handleSortSelect = (field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    handleSortClose();
  };
  
  // CSV Export Functions
  const convertToCSV = (data: any[], headers: Record<string, string>) => {
    if (!data || data.length === 0) return '';
    
    const headerRow = Object.values(headers).join(',');
    const rows = data.map(item => {
      return Object.keys(headers).map(key => {
        let value = getNestedValue(item, key);
        
        // Format dates
        if (key.includes('date') && value) {
          value = formatDateTo12Hour(value);
        }
        
        // Format currency
        if (key === 'amount' && typeof value === 'number') {
          value = value.toFixed(2);
        }
        
        // Handle commas in values
        if (value && typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        
        return value !== undefined && value !== null ? value : '';
      }).join(',');
    }).join('\n');
    
    return `${headerRow}\n${rows}`;
  };
  
  const downloadCSV = (data: any[], filename: string, headers: Record<string, string>) => {
    const csv = convertToCSV(data, headers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Summary cards
  const SummaryCards = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} md={12}>
        <Card sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, flexWrap: 'wrap', p: 2 }}>
            <CardContent sx={{ flex: '1', minWidth: { xs: '100%', sm: '250px' } }}>
              <Typography variant="h6" component="div">
                <MoneyIcon /> Total Revenue
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main', mt: 1 }}>
                {summary && `₹${summary.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {summary && `from ${summary.totalPayments} payments`}
              </Typography>
            </CardContent>
            
            <CardContent sx={{ flex: '1', minWidth: { xs: '100%', sm: '250px' } }}>
              <Typography variant="h6" component="div">
                <TelegramIcon /> Telegram Subscriptions
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', mt: 1 }}>
                  {summary && summary.activeSubscriptions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  active
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {summary && `${summary.expiredSubscriptions} expired • ${telegramSubscriptions.filter(sub => sub.status === 'pending').length} pending`}
              </Typography>
            </CardContent>
            
            <CardContent sx={{ flex: '1', minWidth: { xs: '100%', sm: '250px' } }}>
              <Typography variant="h6" component="div">
                <WarningIcon /> Expiring Soon
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main', mt: 1 }}>
                {summary && summary.expiringWithin7Days}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Subscriptions expiring in 7 days
              </Typography>
            </CardContent>

            <CardContent sx={{ flex: '1', minWidth: { xs: '100%', sm: '250px' } }}>
              <Typography variant="h6" component="div">
                <TrendingUpIcon /> Conversion Rate
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main', mt: 1 }}>
                {summary && `${summary.conversionRate.toFixed(1)}%`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Renewal rate: {summary && `${summary.renewalRate.toFixed(1)}%`}
              </Typography>
            </CardContent>
          </Box>
        </Card>
      </Grid>
    </Grid>
  );

  // Payment table
  const PaymentsTable = () => {
    const paymentHeaders = {
      'email': 'Email',
      'phone': 'Phone',
      'amount': 'Amount',
      'product': 'Product',
      'razorpay_order_id': 'Order ID',
      'payment_date': 'Payment Date',
      'hasAccess': 'Has Access'
    };
    return (
      <>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 2 }}>
          <Typography variant="h6">
            <PaymentsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Payment Records ({filteredPayments.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Sort options">
              <IconButton 
                size="small" 
                onClick={(e) => handleSortClick(e, 0)}
                color={sortConfig.field && sortMenuTab === 0 ? 'primary' : 'default'}
              >
                <SortIcon />
                {sortConfig.field && sortMenuTab === 0 && (
                  sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="Download as CSV">
              <IconButton 
                size="small" 
                onClick={() => downloadCSV(filteredPayments, 'payments', paymentHeaders)}
                disabled={filteredPayments.length === 0}
              >
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl) && sortMenuTab === 0}
          onClose={handleSortClose}
        >
          <MenuItem onClick={() => handleSortSelect('email')}>By Email</MenuItem>
          <MenuItem onClick={() => handleSortSelect('phone')}>By Phone</MenuItem>
          <MenuItem onClick={() => handleSortSelect('amount')}>By Amount</MenuItem>
          <MenuItem onClick={() => handleSortSelect('product')}>By Product</MenuItem>
          <MenuItem onClick={() => handleSortSelect('payment_date')}>By Payment Date</MenuItem>
          <MenuItem onClick={() => handleSortSelect('hasAccess')}>By Access Status</MenuItem>
        </Menu>
        
        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table size={isMobile ? "small" : "medium"}>
            <TableHead sx={{ backgroundColor: theme.palette.grey[200] }}>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Customer</TableCell>
                {!isMobile && <TableCell>Order ID</TableCell>}
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Access</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      {payment.product.toLowerCase().includes('ebook') ? (
                        <Box display="flex" alignItems="center">
                          <EbookIcon fontSize="small" sx={{ mr: 1, color: '#e91e63' }} />
                          {payment.product}
                        </Box>
                      ) : (
                        <Box display="flex" alignItems="center">
                          <TelegramIcon fontSize="small" sx={{ mr: 1, color: '#0088cc' }} />
                          {payment.product}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {payment.email}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {formatPhone(payment.phone)}
                      </Typography>
                    </TableCell>
                    {!isMobile && <TableCell>{payment.razorpay_order_id}</TableCell>}
                    <TableCell>{formatDateTo12Hour(payment.created_at)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={payment.status} 
                        size="small" 
                        color={payment.status === 'SUCCESS' ? 'success' : 'default'} 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell>
                      {payment.product.toLowerCase().includes('ebook') ? (
                        payment.hasEbookAccess ? (
                          <Chip 
                            icon={<CheckIcon />} 
                            label="Granted" 
                            size="small" 
                            color="success" 
                          />
                        ) : (
                          <Chip 
                            icon={<CancelIcon />} 
                            label="Missing" 
                            size="small" 
                            color="error" 
                          />
                        )
                      ) : payment.hasTelegramAccess ? (
                        payment.isExpired ? (
                          <Chip 
                            icon={<CalendarIcon />} 
                            label="Expired" 
                            size="small" 
                            color="warning" 
                          />
                        ) : (
                          <Chip 
                            icon={<CheckIcon />} 
                            label="Active" 
                            size="small" 
                            color="success" 
                          />
                        )
                      ) : (
                        <Chip 
                          icon={<CancelIcon />} 
                          label="Missing" 
                          size="small" 
                          color="error" 
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isMobile ? 6 : 7} align="center">
                    {searchTerm ? 'No matching payments found' : 'No payments found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </>
    );
  };

  // Ebook access table
  const EbookAccessTable = () => {
    const ebookHeaders = {
      'user_name': 'Name',
      'user_email': 'Email',
      'user_phone': 'Phone',
      'payment_id': 'Payment ID',
      'access_granted_date': 'Access Date',
      'drive_link': 'Drive Link'
    };
    return (
      <>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 2 }}>
          <Typography variant="h6">
            <EbookIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Ebook Access Records ({filteredEbookAccesses.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Sort options">
              <IconButton 
                size="small" 
                onClick={(e) => handleSortClick(e, 1)}
                color={sortConfig.field && sortMenuTab === 1 ? 'primary' : 'default'}
              >
                <SortIcon />
                {sortConfig.field && sortMenuTab === 1 && (
                  sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="Download as CSV">
              <IconButton 
                size="small" 
                onClick={() => downloadCSV(filteredEbookAccesses, 'ebook_access', ebookHeaders)}
                disabled={filteredEbookAccesses.length === 0}
              >
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl) && sortMenuTab === 1}
          onClose={handleSortClose}
        >
          <MenuItem onClick={() => handleSortSelect('user_name')}>By Name</MenuItem>
          <MenuItem onClick={() => handleSortSelect('user_email')}>By Email</MenuItem>
          <MenuItem onClick={() => handleSortSelect('user_phone')}>By Phone</MenuItem>
          <MenuItem onClick={() => handleSortSelect('payment_id')}>By Payment ID</MenuItem>
          <MenuItem onClick={() => handleSortSelect('access_granted_date')}>By Access Date</MenuItem>
        </Menu>
        
        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table size={isMobile ? "small" : "medium"}>
            <TableHead sx={{ backgroundColor: theme.palette.grey[200] }}>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Payment</TableCell>
                {!isMobile && <TableCell>Amount</TableCell>}
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEbookAccesses.length > 0 ? (
                filteredEbookAccesses.map((access) => (
                  <TableRow key={access.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {access.user_name}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {access.user_email}
                      </Typography>
                      {access.phone_number && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {formatPhone(access.phone_number)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{access.payment_id}</TableCell>
                    {!isMobile && <TableCell>{formatCurrency(access.amount)}</TableCell>}
                    <TableCell>{formatDateTo12Hour(access.created_at)}</TableCell>
                    <TableCell>
                      {access.access ? (
                        <Button 
                          variant="contained" 
                          size="small" 
                          startIcon={<EbookIcon />}
                          color="success"
                        >
                          Drive Access
                        </Button>
                      ) : (
                        <Button 
                          variant="outlined" 
                          size="small" 
                          startIcon={<HighlightOffIcon />}
                          color="error"
                          disabled
                        >
                          No Access
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isMobile ? 4 : 5} align="center">
                    {searchTerm ? 'No matching ebook accesses found' : 'No ebook accesses found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </>
    );
  };

  // Telegram subscriptions table
  const TelegramSubscriptionsTable = () => {
    const telegramHeaders = {
      'customer_name': 'Customer Name',
      'telegram_username': 'Username',
      'phone_number': 'Phone',
      'email': 'Email',
      'plan_name': 'Plan',
      'plan_duration': 'Duration',
      'start_date': 'Start Date',
      'expiry_date': 'Expiry Date',
      'status': 'Status',
      'daysRemaining': 'Days Remaining'
    };
    return (
      <>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 2 }}>
          <Typography variant="h6">
            <TelegramIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Telegram Subscriptions ({filteredTelegramSubscriptions.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Sort options">
              <IconButton 
                size="small" 
                onClick={(e) => handleSortClick(e, 2)}
                color={sortConfig.field && sortMenuTab === 2 ? 'primary' : 'default'}
              >
                <SortIcon />
                {sortConfig.field && sortMenuTab === 2 && (
                  sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="Download as CSV">
              <IconButton 
                size="small" 
                onClick={() => downloadCSV(filteredTelegramSubscriptions, 'telegram_subscriptions', telegramHeaders)}
                disabled={filteredTelegramSubscriptions.length === 0}
              >
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl) && sortMenuTab === 2}
          onClose={handleSortClose}
        >
          <MenuItem onClick={() => handleSortSelect('customer_name')}>By Customer Name</MenuItem>
          <MenuItem onClick={() => handleSortSelect('telegram_username')}>By Username</MenuItem>
          <MenuItem onClick={() => handleSortSelect('phone_number')}>By Phone</MenuItem>
          <MenuItem onClick={() => handleSortSelect('email')}>By Email</MenuItem>
          <MenuItem onClick={() => handleSortSelect('plan_name')}>By Plan</MenuItem>
          <MenuItem onClick={() => handleSortSelect('start_date')}>By Start Date</MenuItem>
          <MenuItem onClick={() => handleSortSelect('expiry_date')}>By Expiry Date</MenuItem>
          {!showPending && <MenuItem onClick={() => handleSortSelect('daysRemaining')}>By Days Remaining</MenuItem>}
          <MenuItem onClick={() => handleSortSelect('hasPayment')}>By Payment Status</MenuItem>
        </Menu>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <ToggleButtonGroup
            value={showExpired ? 'expired' : (showPending ? 'pending' : 'active')}
            exclusive
            onChange={(_e: React.MouseEvent<HTMLElement>, value: string | null) => {
              if (value === 'active') {
                setShowExpired(false);
                setShowPending(false);
              } else if (value === 'expired') {
                setShowExpired(true);
                setShowPending(false);
              } else if (value === 'pending') {
                setShowExpired(false);
                setShowPending(true);
              }
            }}
            size="small"
            aria-label="subscription status"
          >
            <ToggleButton value="active" aria-label="active subscriptions">
              Active ({telegramSubscriptions.filter((sub: EnhancedTelegramSubscription) => sub.status === 'active').length})
            </ToggleButton>
            <ToggleButton value="expired" aria-label="expired subscriptions">
              Expired ({telegramSubscriptions.filter(sub => sub.status === 'expired').length})
            </ToggleButton>
            <ToggleButton value="pending" aria-label="pending subscriptions">
              Pending ({telegramSubscriptions.filter(sub => sub.status === 'pending').length})
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>Expiry Date</TableCell>
                <TableCell>Status</TableCell>
                {!showPending && <TableCell>Days Remaining</TableCell>}
                <TableCell>Payment</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTelegramSubscriptions.length > 0 ? (
                filteredTelegramSubscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>{sub.customer_name}</TableCell>
                    <TableCell>{sub.telegram_username}</TableCell>
                    <TableCell>{sub.phone_number}</TableCell>
                    <TableCell>{sub.email}</TableCell>
                    <TableCell>
                      {sub.plan_name || 'Unknown'}
                      <Typography variant="caption" display="block">
                        {sub.plan_duration}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDateTo12Hour(sub.start_date)}</TableCell>
                    <TableCell>{formatDateTo12Hour(sub.expiry_date)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={sub.status === 'active' ? "Active" : (sub.status === 'expired' ? "Expired" : "Pending")} 
                        color={sub.status === 'active' ? "success" : (sub.status === 'expired' ? "error" : "warning")}
                        size="small"
                      />
                    </TableCell>
                    {!showPending && (
                      <TableCell>
                        {sub.daysRemaining !== undefined ? (
                          <Chip 
                            label={`${sub.daysRemaining} days`}
                            color={sub.daysRemaining < 7 ? (sub.daysRemaining < 3 ? "error" : "warning") : "default"}
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      {sub.hasPayment ? (
                        <Chip 
                          label="Found"
                          color="success"
                          size="small"
                          variant="outlined"
                          icon={<CheckCircleOutlineIcon />}
                        />
                      ) : (
                        <Chip 
                          label="Missing"
                          color="error"
                          size="small"
                          variant="outlined"
                          icon={<HighlightOffIcon />}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    No {showExpired ? "expired" : (showPending ? "pending" : "active")} telegram subscriptions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, pb: 8 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Analytics Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track payments, subscriptions, and access status across all products
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <SummaryCards />
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center', 
            mb: 2
          }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="analytics tabs">
              <Tab icon={<PaymentsIcon />} label="Payments" />
              <Tab icon={<EbookIcon />} label="Ebook Access" />
              <Tab icon={<TelegramIcon />} label="Telegram Subscriptions" />
            </Tabs>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                placeholder="Search..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: '300px', mr: 2 }}
              />
              <Tooltip title="Advanced Filters">
                <IconButton onClick={toggleFilters} color={showFilters ? "primary" : "default"}>
                  <FilterListIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          {/* Advanced Filter Panels */}
          <Collapse in={showFilters}>
            <Paper sx={{ p: 2, mb: 2, mt: 1 }}>
              {activeTab === 0 && (
                <Stack spacing={2}>
                  <Typography variant="subtitle1" fontWeight="bold">Payment Filters</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Product</InputLabel>
                        <Select
                          value={paymentFilter.product}
                          label="Product"
                          onChange={(e) => handlePaymentFilterChange('product', e.target.value)}
                        >
                          <MenuItem value="">All Products</MenuItem>
                          {uniqueProducts.map(product => (
                            <MenuItem key={product} value={product}>{product}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Has Access</InputLabel>
                        <Select
                          value={paymentFilter.hasAccess}
                          label="Has Access"
                          onChange={(e) => handlePaymentFilterChange('hasAccess', e.target.value)}
                        >
                          <MenuItem value="">All</MenuItem>
                          <MenuItem value="yes">Yes</MenuItem>
                          <MenuItem value="no">No</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        label="Min Amount"
                        type="number"
                        size="small"
                        fullWidth
                        value={paymentFilter.minAmount}
                        onChange={(e) => handlePaymentFilterChange('minAmount', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        label="Max Amount"
                        type="number"
                        size="small"
                        fullWidth
                        value={paymentFilter.maxAmount}
                        onChange={(e) => handlePaymentFilterChange('maxAmount', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        label="Start Date"
                        type="date"
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={paymentFilter.dateRange.startDate || ''}
                        onChange={(e) => handlePaymentDateChange('startDate', e.target.value || null)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        label="End Date"
                        type="date"
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={paymentFilter.dateRange.endDate || ''}
                        onChange={(e) => handlePaymentDateChange('endDate', e.target.value || null)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button 
                        variant="outlined" 
                        startIcon={<ClearIcon />} 
                        onClick={resetFilters}
                        size="small"
                      >
                        Clear Filters
                      </Button>
                    </Grid>
                  </Grid>
                </Stack>
              )}
              
              {activeTab === 1 && (
                <Stack spacing={2}>
                  <Typography variant="subtitle1" fontWeight="bold">Ebook Access Filters</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Ebook</InputLabel>
                        <Select
                          value={ebookFilter.ebook}
                          label="Ebook"
                          onChange={(e) => handleEbookFilterChange('ebook', e.target.value)}
                        >
                          <MenuItem value="">All Ebooks</MenuItem>
                          {uniqueEbooks.map(ebook => (
                            <MenuItem key={ebook} value={ebook}>{ebook}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Has Access</InputLabel>
                        <Select
                          value={ebookFilter.hasAccess}
                          label="Has Access"
                          onChange={(e) => handleEbookFilterChange('hasAccess', e.target.value)}
                        >
                          <MenuItem value="">All</MenuItem>
                          <MenuItem value="yes">Yes</MenuItem>
                          <MenuItem value="no">No</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        label="Start Date"
                        type="date"
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={ebookFilter.dateRange.startDate || ''}
                        onChange={(e) => handleEbookDateChange('startDate', e.target.value || null)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        label="End Date"
                        type="date"
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={ebookFilter.dateRange.endDate || ''}
                        onChange={(e) => handleEbookDateChange('endDate', e.target.value || null)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button 
                        variant="outlined" 
                        startIcon={<ClearIcon />} 
                        onClick={resetFilters}
                        size="small"
                      >
                        Clear Filters
                      </Button>
                    </Grid>
                  </Grid>
                </Stack>
              )}
              
              {activeTab === 2 && (
                <Stack spacing={2}>
                  <Typography variant="subtitle1" fontWeight="bold">Telegram Subscription Filters</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Plan</InputLabel>
                        <Select
                          value={telegramFilter.plan}
                          label="Plan"
                          onChange={(e) => handleTelegramFilterChange('plan', e.target.value)}
                        >
                          <MenuItem value="">All Plans</MenuItem>
                          {uniquePlans.map(plan => (
                            <MenuItem key={plan} value={plan}>{plan}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Has Payment</InputLabel>
                        <Select
                          value={telegramFilter.hasPayment}
                          label="Has Payment"
                          onChange={(e) => handleTelegramFilterChange('hasPayment', e.target.value)}
                        >
                          <MenuItem value="">All</MenuItem>
                          <MenuItem value="yes">Yes</MenuItem>
                          <MenuItem value="no">No</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        label="Start Date"
                        type="date"
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={telegramFilter.dateRange.startDate || ''}
                        onChange={(e) => handleTelegramDateChange('startDate', e.target.value || null)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        label="End Date"
                        type="date"
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={telegramFilter.dateRange.endDate || ''}
                        onChange={(e) => handleTelegramDateChange('endDate', e.target.value || null)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button 
                        variant="outlined" 
                        startIcon={<ClearIcon />} 
                        onClick={resetFilters}
                        size="small"
                      >
                        Clear Filters
                      </Button>
                    </Grid>
                  </Grid>
                </Stack>
              )}
            </Paper>
          </Collapse>
          
          <Divider sx={{ mb: 3 }} />

          {activeTab === 0 && <PaymentsTable />}
          {activeTab === 1 && <EbookAccessTable />}
          {activeTab === 2 && <TelegramSubscriptionsTable />}
        </>
      )}
    </Container>
  );
};

export default AnalyticsPage;
