

export type Category = "ux" | "dev frontend" | "dev backend" | "design" | "marketing" | "project management" | "data" ;

export type Assignment = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "new" | "doing" | "done";
  assignedId?: string;
  assignedTo?: string;
  timestamp: string;
};

export type Member = {
id: `${string}-${string}-${string}-${string}-${string}`;
name: string;
category?: Category;
};


export type NewMember = {

    name:string;

}