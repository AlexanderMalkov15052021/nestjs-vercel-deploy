export enum UserRole {
    REGULAR = "REGULAR",
    ADMIN = "ADMIN"
}

export enum AuthMethod {
    CREDENTIALS = "CREDENTIALS",
    GOOGLE = "GOOGLE",
    YANDEX = "YANDEX"
}

export enum TokenType {
    VERIFICATION = "VERIFICATION",
    TWO_FACTOR = "TWO_FACTOR",
    PASSWORD_RESET = "PASSWORD_RESET"
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