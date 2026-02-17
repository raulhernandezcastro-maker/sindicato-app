import { Card, CardContent } from "../ui/card";
import { AlertCircle, Clock, CheckCircle } from "lucide-react";

export default function ResumenCuotas({
  pendientes = 0,
  conError = 0,
  confirmadas = 0,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* ⏳ PENDIENTES */}
      <Card>
        <CardContent className="pt-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Cuotas pendientes</p>
            <p className="text-3xl font-bold text-yellow-600">
              {pendientes}
            </p>
          </div>
          <div className="p-3 rounded-full bg-yellow-100">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
        </CardContent>
      </Card>

      {/* ❌ CON ERROR */}
      <Card>
        <CardContent className="pt-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Cuotas con error</p>
            <p className="text-3xl font-bold text-red-600">
              {conError}
            </p>
          </div>
          <div className="p-3 rounded-full bg-red-100">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
        </CardContent>
      </Card>

      {/* ✅ CONFIRMADAS */}
      <Card>
        <CardContent className="pt-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Cuotas confirmadas</p>
            <p className="text-3xl font-bold text-green-600">
              {confirmadas}
            </p>
          </div>
          <div className="p-3 rounded-full bg-green-100">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
