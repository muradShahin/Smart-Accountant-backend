export interface User {
    id?: number;
    name: string;
    email: string;
    password: string;
}

export interface Transaction {
    id?: number;
    user_id: number;
    type: 'income' | 'expense';
    amount: number;
    date: Date;
    category: string;
    notes?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface Employee {
    id?: number;
    name: string;
    email: string;
    hire_date: Date;
    base_salary: number;
    position: string;
    status?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface EmployeeTransaction {
    id?: number;
    employee_id: number;
    type: 'advance' | 'deduction' | 'overtime';
    amount: number;
    date: Date;
    description?: string;
    created_at?: Date;
}

export interface Attendance {
    id?: number;
    employee_id: number;
    date: Date;
    check_in?: string;
    check_out?: string;
    overtime_hours?: number;
    overtime_rate?: number;
    notes?: string;
    created_at?: Date;
}