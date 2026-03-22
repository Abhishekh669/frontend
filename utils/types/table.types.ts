type TableState = "occupied" | "empty" | "booked"
export interface TableType {
    id : string;
    table_number : number;
    status : TableState;
    capacity : number;
    created_at : Date
}

export type  UpdateTable = Omit<TableType , "created_at" >
export type CreateTable = Omit<TableType, "id"|  "created_at">



export interface  TableValidationType {
    id : string;
    table_number : number;
    phone_number : string;
    waiter_id ?: string;
    created_at : Date;
    updated_at : Date;
} 
