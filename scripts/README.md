# Scripts de Administración

Scripts utilitarios para operaciones manuales y recuperación de errores.

## Uso

Todos los scripts se ejecutan con:

```bash
npx tsx scripts/<nombre-del-script>.ts
```

## Scripts Disponibles

### `reset-reminder.ts`

Resetea el flag `reminder_24h_sent` de una sesión para permitir reenviar el recordatorio.

**Cuándo usar:** Si el recordatorio falló y necesitas reenviarlo.

```bash
npx tsx scripts/reset-reminder.ts
# Luego reiniciar el servidor para que el cron lo procese
```

### `send-reminder-now.ts`

Envía el recordatorio de pago inmediatamente, ignorando la ventana de 24 horas.

**Cuándo usar:** Si una sesión quedó fuera de la ventana de tiempo y necesitas enviar el recordatorio manualmente.

```bash
npx tsx scripts/send-reminder-now.ts
```

### `send-new-payment-link.ts`

Genera un nuevo link de pago y lo envía por WhatsApp.

**Cuándo usar:**
- Si el link de pago expiró
- Si cambiaste de credenciales de Mercado Pago (sandbox → producción)

```bash
npx tsx scripts/send-new-payment-link.ts
```

### `confirm-payment-manually.ts`

Confirma un pago manualmente, actualiza el estado en la base de datos, y envía la confirmación + link de Meet.

**Cuándo usar:** Si el webhook de Mercado Pago no llegó (ej: ngrok desconectado) pero el pago sí se realizó.

```bash
npx tsx scripts/confirm-payment-manually.ts
```

## Nota

Estos scripts están hardcodeados para la sesión de prueba (`f05c7dc3-cf7d-4faa-85a2-4d5e77ccb571`). Para usar en producción, modificar el `sessionId` en cada script o parametrizarlo.
