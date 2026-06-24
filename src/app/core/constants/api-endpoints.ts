export class ApiEndpoints {
  static readonly Auth = {
    authenticate: '/api/TokenAuth/Authenticate',
    registerECommerceCustomer: '/api/TokenAuth/RegisterECommerceCustomer',
    getECommerceCustomerProfile: '/api/TokenAuth/GetECommerceCustomerProfile',
    externalAuthenticateECommerce: '/api/TokenAuth/ExternalAuthenticateECommerce',
  };

  static readonly Catalog = {
    products: '/Products/GetList',
    productById: '/Products/GetById',
    categories: '/Categories/GetTree',
  };

  static readonly EcPublicSettings = {
    getPortalConfiguration: '/api/services/app/EcPublicSettings/GetPortalConfiguration',
  };

  static readonly EcPublicCatalog = {
    categoriesTree: '/api/services/app/EcPublicCatalog/GetCategoriesTree',
    homeSliders: '/api/services/app/EcPublicCatalog/GetHomeSliders',
    brands: '/api/services/app/EcPublicCatalog/GetBrands',
    productFilters: '/api/services/app/EcPublicCatalog/GetProductFilters',
    searchProducts: '/api/services/app/EcPublicCatalog/SearchProducts',
    productDetails: '/api/services/app/EcPublicCatalog/GetProductDetails',
    productVariants: '/api/services/app/EcPublicCatalog/GetProductVariants',
    productImages: '/api/services/app/EcPublicCatalog/GetProductImages',
    variantImages: '/api/services/app/EcPublicCatalog/GetVariantImages',
    productSpecifications: '/api/services/app/EcPublicCatalog/GetProductSpecifications',
    relatedProducts: '/api/services/app/EcPublicCatalog/GetRelatedProducts',
    finalPrice: '/api/services/app/EcPublicCatalog/GetFinalPrice',
    getFaqs: '/api/services/app/EcPublicCatalog/GetFaqs',
    searchFaqs: '/api/services/app/EcPublicCatalog/SearchFaqs',
    rateFaq: '/api/services/app/EcPublicCatalog/RateFaq',
  };

  static readonly EcCoupons = {
    getAll: '/api/services/app/EcCoupons/GetAll',
  };

  static readonly EcCart = {
    mergeGuestCart: '/api/services/app/EcCart/MergeGuestCart',
    addToCart: '/api/services/app/EcCart/AddToCart',
    getCart: '/api/services/app/EcCart/GetCart',
    updateCart: '/api/services/app/EcCart/UpdateCart',
    removeCartItem: '/api/services/app/EcCart/RemoveCartItem',
    clearCart: '/api/services/app/EcCart/ClearCart',
  };

  static readonly Cart = {
    get: '/Cart/Get',
    add: '/Cart/AddItem',
    update: '/Cart/UpdateItem',
    remove: '/Cart/RemoveItem',
  };

  static readonly FndLookupValues = {
    getSelect2: '/api/services/app/FndLookupValues/GetFndLookupValuesSelect2',
    getAllWithSearch: '/api/services/app/FndLookupValues/GetAllWithSearch',
  };

  static readonly EcCustomerProfile = {
    getMyProfile: '/api/services/app/EcCustomerProfile/GetMyProfile',
    updateProfile: '/api/services/app/EcCustomerProfile/UpdateProfile',
  };

  static readonly EcOrders = {
    getCustomerOrders: '/api/services/app/EcOrders/GetCustomerOrders',
    getOrderDetails: '/api/services/app/EcOrders/GetOrderDetails',
    getOrderStatusHistory: '/api/services/app/EcOrders/GetOrderStatusHistory',
    getAll: '/api/services/app/EcOrders/GetAll',
    placeOrder: '/api/services/app/EcOrders/PlaceOrder',
  };

  static readonly EcCheckout = {
    placeOrder: '/api/services/app/EcCheckout/PlaceOrder',
    validateCoupon: '/api/services/app/EcCheckout/ValidateCoupon',
  };

  static readonly EcWishlist = {
    saveProduct: '/api/services/app/EcWishlist/SaveProduct',
    remove: '/api/services/app/EcWishlist/Remove',
    moveToCart: '/api/services/app/EcWishlist/MoveToCart',
    getWishlist: '/api/services/app/EcWishlist/GetWishlist',
  };

  static readonly EcCustomerAddresses = {
    getAll: '/api/services/app/EcCustomerAddresses/GetAll',
    create: '/api/services/app/EcCustomerAddresses/Create',
    update: '/api/services/app/EcCustomerAddresses/Update',
    delete: '/api/services/app/EcCustomerAddresses/Delete',
    getSingle: '/api/services/app/EcCustomerAddresses/GetSingle',
  };

  /** @deprecated Use EcOrders.placeOrder */
  static readonly Checkout = {
    placeOrder: '/Orders/PlaceOrder',
  };

  static readonly Account = {
    isTenantAvailable: '/api/services/app/Account/IsTenantAvailable',
    orders: '/Orders/GetMyOrders',
    profile: '/Customers/GetProfile',
  };

  /** Default route after successful customer login. */
  static readonly postLoginUrl = '/account/profile';
}
