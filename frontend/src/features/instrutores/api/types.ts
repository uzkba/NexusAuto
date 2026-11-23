export type Period = "manha" | "tarde" | "noite";

export interface City {
    ibge_code: number;
    name: string;
    uf: string;
}
export interface Availability {
    weekday: number;
    periods: Period[];
}
export interface Vehicle {
    type: string;
    brand_model: string;
    year: number;
    transmission: "manual" | "automatico";
    dual_control: boolean;
    category: "A" | "B";
}
export interface ReviewItem {
    id: number;
    rating: number;
    comment: string | null;
    created_at: string;
    author_name: string;
}
export interface InstrutorPerfil {
    id: string;
    display_name: string;
    photo_url: string | null;
    bio: string | null;
    training_structure: string | null;
    phone: string | null;
    cities: City[];
    categories: ("A" | "B")[];
    terrains: string[];
    availability: Availability[];
    vehicles: Vehicle[];
    accreditation: {
        status: "aprovado" | "pendente";
        reviewed_at: string | null;
    };
    reviews: { average: number | null; count: number; items: ReviewItem[] };
}
