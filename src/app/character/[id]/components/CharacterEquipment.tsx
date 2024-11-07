import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sword, Shield, Shirt } from "lucide-react";

interface Equipment {
  weapon: any;
  armor: any;
  shield: any;
  accessories: any[];
}

export default function CharacterEquipment({
  equipment,
}: {
  equipment: Equipment;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sword className="w-5 h-5" />
          Equipment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {equipment.weapon && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sword className="w-4 h-4" />
              <span>Weapon</span>
            </div>
            <div className="space-y-1">
              <Badge variant="outline">{equipment.weapon.name}</Badge>
              <p className="text-sm text-muted-foreground">
                Damage: {equipment.weapon.stats.damage}
              </p>
            </div>
          </div>
        )}

        {equipment.armor && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shirt className="w-4 h-4" />
              <span>Armor</span>
            </div>
            <div className="space-y-1">
              <Badge variant="outline">{equipment.armor.name}</Badge>
              <p className="text-sm text-muted-foreground">
                Defense: {equipment.armor.stats.defense}
              </p>
            </div>
          </div>
        )}

        {equipment.shield && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Shield</span>
            </div>
            <div className="space-y-1">
              <Badge variant="outline">{equipment.shield.name}</Badge>
              <p className="text-sm text-muted-foreground">
                Defense: {equipment.shield.stats.defense}
              </p>
            </div>
          </div>
        )}

        {equipment.accessories.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Accessories</h4>
            <div className="grid grid-cols-2 gap-2">
              {equipment.accessories.map((accessory: any) => (
                <Badge key={accessory._id} variant="outline">
                  {accessory.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
