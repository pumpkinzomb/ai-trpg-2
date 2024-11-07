import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Backpack, Coins } from "lucide-react";

interface InventoryItem {
  _id: string;
  name: string;
  type: string;
  rarity: string;
  value: number;
}

interface Props {
  inventory: InventoryItem[];
  gold: number;
}

export default function CharacterInventory({ inventory, gold }: Props) {
  // 아이템을 타입별로 그룹화
  const groupedItems = inventory.reduce(
    (acc: { [key: string]: InventoryItem[] }, item) => {
      if (!acc[item.type]) {
        acc[item.type] = [];
      }
      acc[item.type].push(item);
      return acc;
    },
    {}
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Backpack className="w-5 h-5" />
            Inventory
          </div>
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4" />
            <span>{gold} GP</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {Object.entries(groupedItems).map(([type, items]) => (
              <div key={type} className="space-y-2">
                <h4 className="font-medium capitalize">{type}</h4>
                <div className="grid grid-cols-1 gap-2">
                  {items.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between p-2 border rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span>{item.name}</span>
                        <Badge variant="outline" className="capitalize">
                          {item.rarity}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {item.value} GP
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
