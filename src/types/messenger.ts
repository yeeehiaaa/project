export type ConversationType = "patient" | "colleague" | "group";

export interface MessageAttachment {
  id: string;
  name: string;
  type: "pdf" | "image" | "prescription" | "lab" | "dicom";
  size?: string;
  url?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "doctor" | "colleague" | "patient" | "system";
  senderSpecialty?: string;
  text: string;
  time: string;
  date: string;
  status: "sent" | "delivered" | "read";
  attachment?: MessageAttachment;
}

export interface DoctorContact {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  city: string;
  phone: string;
  email: string;
  licenseNumber: string;
  online: boolean;
  avatarUrl?: string;
  roleInGroup?: "admin" | "member";
}

export interface PatientContact {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  bloodGroup: string;
  chronicCondition?: string;
  allergies?: string[];
  lastVisit?: string;
  online: boolean;
  avatarUrl?: string;
}

export interface MedicalGroupInfo {
  id: string;
  name: string;
  description: string;
  specialty: string;
  createdDate: string;
  createdBy: string;
  members: DoctorContact[];
}

export interface Conversation {
  id: string;
  type: ConversationType;
  title: string;
  subtitle: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  unreadCount?: number;
  status: "urgent" | "normal";
  online?: boolean;
  patient?: PatientContact;
  doctor?: DoctorContact;
  group?: MedicalGroupInfo;
  messages: Message[];
}
