export enum UserRole {
    REGULAR,
    ADMIN
}

export enum AuthMethod {
    CREDENTIALS,
    GOOGLE,
    YANDEX
}

export enum TokenType {
    VERIFICATION,
    TWO_FACTOR,
    PASSWORD_RESET
}


export type User = {
    id: string;
    email: string;
    password: string;
    displayName: string;
    picture: string | null;
    role: UserRole;
    isVerified: boolean;
    isTwoFactorEnabled: boolean;
    method: AuthMethod;
    createdAt: Date;
    updatedAt: Date;
}