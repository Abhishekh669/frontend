export interface CreateCustomerOrderRequest{
    table_number : number;
    customer_name ?: string;
    customer_phone ?: string;
    note ?: string;
    order_menu_items : OrderMenuItem[]
}


export interface OrderMenuItem {
    menu_item_id : string;
    quantity : number;
    price : number;
}