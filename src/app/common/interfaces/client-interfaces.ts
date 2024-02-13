export interface UserPersmission {
    userId: string;
    role: 'admin' | 'manager';
}

export interface ClientMainAttributes {
    id?: string;
    name: string;
    notes: string;
    role?: string
}

export interface ClientRemainingAttributes {
    userPermissions: UserPersmission[];
}
