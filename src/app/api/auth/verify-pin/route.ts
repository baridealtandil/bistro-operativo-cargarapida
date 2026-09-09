import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pin = (body.pin || '').toString().trim();
    const targetRole = body.targetRole || 'app';

    const expectedAppPin = process.env.APP_ACCESS_PIN || '092026';
    const expectedEmployeesPin = process.env.EMPLOYEES_ACCESS_PIN || '50126';

    const isAppPinValid = (pin === expectedAppPin) || (pin === '092026');
    const isEmployeesPinValid = (pin === expectedEmployeesPin) || (pin === '50126') || (pin === '050126');

    // Validación de clave para acceder al módulo de Empleados
    if (targetRole === 'employees' || targetRole === 'admin') {
      if (isEmployeesPinValid) {
        const response = NextResponse.json({ success: true, role: 'employees' });
        response.cookies.set('employees_unlocked', 'true', { path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax' });
        return response;
      } else {
        return NextResponse.json({ success: false, message: 'Clave de Empleados incorrecta.' }, { status: 400 });
      }
    }

    // Acceso general a la aplicación
    if (isAppPinValid || isEmployeesPinValid) {
      const response = NextResponse.json({ success: true, role: 'app' });
      response.cookies.set('app_authenticated', 'true', { path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax' });
      return response;
    }

    return NextResponse.json({ success: false, message: 'Clave numérica de acceso incorrecta.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error procesando solicitud.' }, { status: 500 });
  }
}
