export type UserRole = "USER" | "OWNER" | "ADMIN";
export type CabinStatus = "PENDING" | "APPROVED" | "REJECTED";

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  profileImage?: string | null;
  role: UserRole;
  giftCredit?: number;
  successfulBookings?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type Cabin = {
  id: string;
  ownerId?: string | null;
  name: string;
  location: string;
  price: number;
  image: string | null;
  images: string[];
  description: string;
  rating: number;
  reviews: number;
  facilities: string[];
  status?: CabinStatus;
  isActive?: boolean;
  owner?: User | null;
  createdAt?: string;
  updatedAt?: string;
};

export type GiftType = "VOUCHER" | "CABIN";
export type GiftStatus = "PENDING_OWNER_CONFIRMATION" | "SENT" | "ACCEPTED" | "DECLINED" | "REJECTED";

export type Gift = {
  id: string;
  senderId: string;
  recipientId?: string | null;
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  giftType: GiftType;
  amount: number | null;
  cabinId: string | null;
  checkInDate: string | null;
  checkOutDate: string | null;
  travellers: number | null;
  message: string | null;
  deliveryDate: string | null;
  totalPrice: number | null;
  status: GiftStatus;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentReference?: string | null;
  paidAt?: string | null;
  acceptedAt?: string | null;
  declinedAt?: string | null;
  sender?: User;
  recipient?: User | null;
  cabin?: Cabin | null;
  booking?: Booking | null;
  createdAt: string;
  updatedAt: string;
};

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
export type PaymentMethod = "UNPAID" | "PAY_AT_PROPERTY" | "GIFT_CREDIT" | "FAKE_ESEWA" | "ESEWA" | "GIFT";
export type PaymentStatus = "UNPAID" | "PENDING" | "PAID";

export type Booking = {
  id: string;
  userId: string;
  cabinId: string;
  giftId?: string | null;
  fullName: string;
  phone: string;
  email: string;
  checkInDate: string;
  checkOutDate: string;
  travellers: number;
  specialRequest: string | null;
  totalPrice: number;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference?: string | null;
  paidAt?: string | null;
  giftCreditUsed?: number;
  isGift?: boolean;
  cabin: Cabin;
  user?: User;
  gift?: Gift | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Bookmark = {
  id: string;
  userId: string;
  cabinId: string;
  cabin: Cabin;
  createdAt: string;
};

export type ReviewUser = Pick<User, "id" | "firstName" | "lastName">;

export type Review = {
  id: string;
  userId: string;
  cabinId: string;
  rating: number;
  comment: string | null;
  user?: ReviewUser;
  createdAt: string;
  updatedAt: string;
};

export type Feedback = {
  id: string;
  userId: string;
  subject: string;
  message: string;
  screenshot: string | null;
  user?: User;
  createdAt: string;
};

export type NotificationType = "BOOKING" | "GIFT" | "CABIN" | "PAYMENT" | "FEEDBACK" | "PROFILE" | "SYSTEM";

export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
};
