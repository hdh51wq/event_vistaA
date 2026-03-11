export interface FurnitureItem {
  id: string;
  label: string;
  views: {
    front: string;
    back?: string;
    left?: string;
    right?: string;
  };
  defaultWidth: number;
  defaultHeight: number;
  price?: number;
}

export const FURNITURE_ITEMS: FurnitureItem[] = [
  { 
    id: "chair", 
    label: "Chair", 
    views: { 
      front: "/furniture/chairfront.png",
      back: "/furniture/chairback.png", 
      left: "/furniture/chairleft.png", 
      right: "/furniture/chairright.png" 
    }, 
    defaultWidth: 90, 
    defaultHeight: 110,
    price: 75
  },
  { 
    id: "sofa", 
    label: "Sofa", 
    views: { 
      front: "/furniture/sofa.png",
      back: "/furniture/sofaback.png", 
      left: "/furniture/sofaleft.png", 
      right: "/furniture/sofaright.png" 
    }, 
    defaultWidth: 160, 
    defaultHeight: 100,
    price: 450
  },
  { 
    id: "table", 
    label: "Table", 
    views: { 
      front: "/furniture/table.png",
      back: "/furniture/table_back.svg", 
      left: "/furniture/table_left.svg", 
      right: "/furniture/table_right.svg" 
    }, 
    defaultWidth: 140, 
    defaultHeight: 100,
    price: 220
  },
  { 
    id: "lamp", 
    label: "Floor Lamp", 
    views: { 
      front: "/furniture/lamp.png",
      back: "/furniture/lamp.png", 
      left: "/furniture/lamp.png", 
      right: "/furniture/lamp.png" 
    }, 
    defaultWidth: 60, 
    defaultHeight: 160,
    price: 120
  },
  { 
    id: "plant", 
    label: "Plant", 
    views: { 
      front: "/furniture/plant.png",
      back: "/furniture/plant.png", 
      left: "/furniture/plant.png", 
      right: "/furniture/plant.png" 
    }, 
    defaultWidth: 80, 
    defaultHeight: 130,
    price: 45
  },
  { 
    id: "coffee-table", 
    label: "Coffee Table", 
    views: { 
      front: "/furniture/coffee-table.png",
      back: "/furniture/coffee-table.png", 
      left: "/furniture/coffee-table_left.png", 
      right: "/furniture/coffee-table_left.png" 
    }, 
    defaultWidth: 130, 
    defaultHeight: 80,
    price: 180
  },
  { 
    id: "bookshelf", 
    label: "Bookshelf", 
    views: { 
      front: "/furniture/bookshelf.png",
      back: "/furniture/bookshelf_back.png", 
      left: "/furniture/bookshelf_left.png", 
      right: "/furniture/bookshelf_right.png" 
    }, 
    defaultWidth: 110, 
    defaultHeight: 160,
    price: 250
  },
  { 
    id: "flower-vase", 
    label: "Flower Vase", 
    views: { 
      front: "/furniture/flower-vase.png",
      back: "/furniture/flower-vase.png", 
      left: "/furniture/flower-vase.png", 
      right: "/furniture/flower-vase.png" 
    }, 
    defaultWidth: 70, 
    defaultHeight: 130,
    price: 35
  },
  { 
    id: "dining-table", 
    label: "Dining Table", 
    views: { 
      front: "/furniture/dining-table.png",
      back: "/furniture/dining-table_left.png", 
      left: "/furniture/dining-table.png", 
      right: "/furniture/dining-table_left.png" 
    }, 
    defaultWidth: 160, 
    defaultHeight: 110,
    price: 550
  },
];
