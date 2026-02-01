
export interface RawMaterialType {
    id : string;
    name : string;
    price : number;
    quantity : number;
    unit : string;
    created_at : Date;
    updated_at : number;
}

export interface UpdateRawMaterialType {
    id : string;
    name : string;
    price : number;
    quantity : number;
    unit : string;
}



export interface RawMaterialStatistic {
    total_materials : number;
    total_quantity : number;
    total_price : number;
    recent_price : number;
}