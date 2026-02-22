const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// ==================== USERS ====================
const User = sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: true, field: 'password_hash' },
    role: { type: DataTypes.ENUM('super_admin', 'owner', 'staff'), defaultValue: 'owner' },
    googleId: { type: DataTypes.STRING, allowNull: true, field: 'google_id' },
    emailVerified: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'email_verified' },
    name: { type: DataTypes.STRING, allowNull: true },
    avatar: { type: DataTypes.STRING, allowNull: true },
}, { tableName: 'users', underscored: true });

// ==================== OWNER PROFILES ====================
const OwnerProfile = sequelize.define('OwnerProfile', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    spaceName: { type: DataTypes.STRING, allowNull: false, field: 'space_name' },
    logoUrl: { type: DataTypes.STRING, allowNull: true, field: 'logo_url' },
    gstNumber: { type: DataTypes.STRING, allowNull: true, field: 'gst_number' },
    panNumber: { type: DataTypes.STRING, allowNull: true, field: 'pan_number' },
    cin: { type: DataTypes.STRING, allowNull: true },
    registeredAddress: { type: DataTypes.TEXT, allowNull: true, field: 'registered_address' },
    city: { type: DataTypes.STRING, allowNull: true },
    state: { type: DataTypes.STRING, allowNull: true },
    pincode: { type: DataTypes.STRING(10), allowNull: true },
    bankName: { type: DataTypes.STRING, allowNull: true, field: 'bank_name' },
    accountNumber: { type: DataTypes.STRING, allowNull: true, field: 'account_number' },
    ifscCode: { type: DataTypes.STRING, allowNull: true, field: 'ifsc_code' },
    contactEmail: { type: DataTypes.STRING, allowNull: true, field: 'contact_email' },
    phone: { type: DataTypes.STRING, allowNull: true },
    invoicePrefix: { type: DataTypes.STRING, defaultValue: 'INV', field: 'invoice_prefix' },
    currency: { type: DataTypes.STRING(3), defaultValue: 'INR' },
    timezone: { type: DataTypes.STRING, defaultValue: 'Asia/Kolkata' },
    setupCompleted: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'setup_completed' },
}, { tableName: 'owner_profiles', underscored: true });

// ==================== COMPANIES ====================
const Company = sequelize.define('Company', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    ownerId: { type: DataTypes.UUID, allowNull: false, field: 'owner_id' },
    name: { type: DataTypes.STRING, allowNull: false },
    gstNumber: { type: DataTypes.STRING, allowNull: true, field: 'gst_number' },
    contactPerson: { type: DataTypes.STRING, allowNull: true, field: 'contact_person' },
    email: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    agreementStart: { type: DataTypes.DATEONLY, allowNull: true, field: 'agreement_start' },
    agreementEnd: { type: DataTypes.DATEONLY, allowNull: true, field: 'agreement_end' },
    seats: { type: DataTypes.INTEGER, defaultValue: 1 },
    seatCost: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'seat_cost' },
    billingCycle: { type: DataTypes.ENUM('monthly', 'quarterly', 'custom'), defaultValue: 'monthly', field: 'billing_cycle' },
    gstApplicable: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'gst_applicable' },
    gstPercent: { type: DataTypes.DECIMAL(5, 2), defaultValue: 18.00, field: 'gst_percent' },
    advanceAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'advance_amount' },
    securityDeposit: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'security_deposit' },
    billingDate: { type: DataTypes.INTEGER, defaultValue: 1, field: 'billing_date' },
    prorata: { type: DataTypes.BOOLEAN, defaultValue: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('active', 'inactive', 'terminated'), defaultValue: 'active' },
}, { tableName: 'companies', underscored: true });

// ==================== COMPANY DOCUMENTS ====================
const CompanyDocument = sequelize.define('CompanyDocument', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    companyId: { type: DataTypes.UUID, allowNull: false, field: 'company_id' },
    docType: { type: DataTypes.STRING, allowNull: false, field: 'doc_type' },
    filePath: { type: DataTypes.STRING, allowNull: false, field: 'file_path' },
    originalName: { type: DataTypes.STRING, allowNull: false, field: 'original_name' },
    fileSize: { type: DataTypes.INTEGER, allowNull: true, field: 'file_size' },
}, { tableName: 'company_documents', underscored: true });

// ==================== INVOICES ====================
const Invoice = sequelize.define('Invoice', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    companyId: { type: DataTypes.UUID, allowNull: false, field: 'company_id' },
    ownerId: { type: DataTypes.UUID, allowNull: false, field: 'owner_id' },
    invoiceNumber: { type: DataTypes.STRING, allowNull: false, unique: true, field: 'invoice_number' },
    type: { type: DataTypes.ENUM('recurring', 'prorata', 'custom', 'meeting_room'), defaultValue: 'recurring' },
    subtotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    gstAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'gst_amount' },
    total: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    paidAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'paid_amount' },
    status: { type: DataTypes.ENUM('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'), defaultValue: 'draft' },
    dueDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'due_date' },
    paidDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'paid_date' },
    paymentMode: { type: DataTypes.STRING, allowNull: true, field: 'payment_mode' },
    transactionId: { type: DataTypes.STRING, allowNull: true, field: 'transaction_id' },
    lineItems: { type: DataTypes.JSONB, defaultValue: [], field: 'line_items' },
    gstPercent: { type: DataTypes.DECIMAL(5, 2), defaultValue: 18.00, field: 'gst_percent' },
    notes: { type: DataTypes.TEXT, allowNull: true },
    billingPeriodStart: { type: DataTypes.DATEONLY, allowNull: true, field: 'billing_period_start' },
    billingPeriodEnd: { type: DataTypes.DATEONLY, allowNull: true, field: 'billing_period_end' },
}, { tableName: 'invoices', underscored: true });

// ==================== PAYMENTS ====================
const Payment = sequelize.define('Payment', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    invoiceId: { type: DataTypes.UUID, allowNull: false, field: 'invoice_id' },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    paymentDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'payment_date' },
    mode: { type: DataTypes.STRING, allowNull: true },
    transactionId: { type: DataTypes.STRING, allowNull: true, field: 'transaction_id' },
    notes: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'payments', underscored: true });

// ==================== SEATS ====================
const Seat = sequelize.define('Seat', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    ownerId: { type: DataTypes.UUID, allowNull: false, field: 'owner_id' },
    label: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.ENUM('hot_desk', 'dedicated', 'private_cabin'), defaultValue: 'dedicated' },
    floor: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.ENUM('available', 'occupied', 'maintenance'), defaultValue: 'available' },
    companyId: { type: DataTypes.UUID, allowNull: true, field: 'company_id' },
}, { tableName: 'seats', underscored: true });

// ==================== MEETING ROOMS ====================
const MeetingRoom = sequelize.define('MeetingRoom', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    ownerId: { type: DataTypes.UUID, allowNull: false, field: 'owner_id' },
    name: { type: DataTypes.STRING, allowNull: false },
    code: { type: DataTypes.STRING, allowNull: true },
    capacity: { type: DataTypes.INTEGER, defaultValue: 10 },
    floor: { type: DataTypes.STRING, allowNull: true },
    amenities: { type: DataTypes.JSONB, defaultValue: [] },
    hourlyCost: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'hourly_cost' },
    gstApplicable: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'gst_applicable' },
    gstPercent: { type: DataTypes.DECIMAL(5, 2), defaultValue: 18.00, field: 'gst_percent' },
    bufferTime: { type: DataTypes.INTEGER, defaultValue: 15, field: 'buffer_time' },
    imageUrl: { type: DataTypes.STRING, allowNull: true, field: 'image_url' },
    status: { type: DataTypes.ENUM('active', 'inactive', 'maintenance'), defaultValue: 'active' },
}, { tableName: 'meeting_rooms', underscored: true });

// ==================== ROOM BOOKINGS ====================
const RoomBooking = sequelize.define('RoomBooking', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    roomId: { type: DataTypes.UUID, allowNull: false, field: 'room_id' },
    companyId: { type: DataTypes.UUID, allowNull: false, field: 'company_id' },
    ownerId: { type: DataTypes.UUID, allowNull: false, field: 'owner_id' },
    bookingDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'booking_date' },
    startTime: { type: DataTypes.TIME, allowNull: false, field: 'start_time' },
    endTime: { type: DataTypes.TIME, allowNull: false, field: 'end_time' },
    actualEndTime: { type: DataTypes.TIME, allowNull: true, field: 'actual_end_time' },
    attendees: { type: DataTypes.INTEGER, defaultValue: 1 },
    purpose: { type: DataTypes.STRING, allowNull: true },
    specialRequirements: { type: DataTypes.TEXT, allowNull: true, field: 'special_requirements' },
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled', 'completed'), defaultValue: 'pending' },
    rejectionReason: { type: DataTypes.TEXT, allowNull: true, field: 'rejection_reason' },
    cost: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    gstAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'gst_amount' },
    totalCost: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'total_cost' },
    invoiceId: { type: DataTypes.UUID, allowNull: true, field: 'invoice_id' },
    notes: { type: DataTypes.TEXT, allowNull: true },
    isRecurring: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_recurring' },
}, { tableName: 'room_bookings', underscored: true });

// ==================== COMPANY ROOM ALLOWANCES ====================
const CompanyRoomAllowance = sequelize.define('CompanyRoomAllowance', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    companyId: { type: DataTypes.UUID, allowNull: false, field: 'company_id' },
    ownerId: { type: DataTypes.UUID, allowNull: false, field: 'owner_id' },
    hoursPerMonth: { type: DataTypes.DECIMAL(6, 2), defaultValue: 10, field: 'hours_per_month' },
    allowanceType: { type: DataTypes.ENUM('fixed_monthly', 'fixed_weekly', 'unlimited'), defaultValue: 'fixed_monthly', field: 'allowance_type' },
    hoursUsed: { type: DataTypes.DECIMAL(6, 2), defaultValue: 0, field: 'hours_used' },
    periodStart: { type: DataTypes.DATEONLY, allowNull: true, field: 'period_start' },
    periodEnd: { type: DataTypes.DATEONLY, allowNull: true, field: 'period_end' },
}, { tableName: 'company_room_allowances', underscored: true });

// ==================== REMINDER SETTINGS ====================
const ReminderSetting = sequelize.define('ReminderSetting', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    ownerId: { type: DataTypes.UUID, allowNull: false, field: 'owner_id' },
    beforeDays: { type: DataTypes.INTEGER, defaultValue: 3, field: 'before_days' },
    onDueDate: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'on_due_date' },
    afterDays: { type: DataTypes.INTEGER, defaultValue: 7, field: 'after_days' },
    enabled: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'reminder_settings', underscored: true });

// ==================== EMAIL TEMPLATES ====================
const EmailTemplate = sequelize.define('EmailTemplate', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    ownerId: { type: DataTypes.UUID, allowNull: false, field: 'owner_id' },
    templateType: { type: DataTypes.STRING, allowNull: false, field: 'template_type' },
    subject: { type: DataTypes.STRING, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
}, { tableName: 'email_templates', underscored: true });

// ==================== AUDIT LOGS ====================
const AuditLog = sequelize.define('AuditLog', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    ownerId: { type: DataTypes.UUID, allowNull: true, field: 'owner_id' },
    userId: { type: DataTypes.UUID, allowNull: true, field: 'user_id' },
    action: { type: DataTypes.STRING, allowNull: false },
    entityType: { type: DataTypes.STRING, allowNull: true, field: 'entity_type' },
    entityId: { type: DataTypes.UUID, allowNull: true, field: 'entity_id' },
    details: { type: DataTypes.JSONB, defaultValue: {} },
    ipAddress: { type: DataTypes.STRING, allowNull: true, field: 'ip_address' },
}, { tableName: 'audit_logs', underscored: true });

// ==================== ASSOCIATIONS ====================
User.hasOne(OwnerProfile, { foreignKey: 'user_id', as: 'profile' });
OwnerProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Company.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });
User.hasMany(Company, { foreignKey: 'owner_id', as: 'companies' });

Company.hasMany(CompanyDocument, { foreignKey: 'company_id', as: 'documents' });
CompanyDocument.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

Company.hasMany(Invoice, { foreignKey: 'company_id', as: 'invoices' });
Invoice.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

Invoice.hasMany(Payment, { foreignKey: 'invoice_id', as: 'payments' });
Payment.belongsTo(Invoice, { foreignKey: 'invoice_id', as: 'invoice' });

Company.hasMany(Seat, { foreignKey: 'company_id', as: 'assignedSeats' });
Seat.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

MeetingRoom.hasMany(RoomBooking, { foreignKey: 'room_id', as: 'bookings' });
RoomBooking.belongsTo(MeetingRoom, { foreignKey: 'room_id', as: 'room' });

Company.hasMany(RoomBooking, { foreignKey: 'company_id', as: 'bookings' });
RoomBooking.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

Company.hasOne(CompanyRoomAllowance, { foreignKey: 'company_id', as: 'roomAllowance' });
CompanyRoomAllowance.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

module.exports = {
    sequelize,
    User,
    OwnerProfile,
    Company,
    CompanyDocument,
    Invoice,
    Payment,
    Seat,
    MeetingRoom,
    RoomBooking,
    CompanyRoomAllowance,
    ReminderSetting,
    EmailTemplate,
    AuditLog,
};
