// Prepend a flash message to the list. Success messages auto-dismiss after 2 s;
// danger messages stay until the user closes them manually.
export function flash(ctx, message, type = 'success') {
  const id = Date.now()
  ctx.flashMessages.update(messages => [{ type, message, id }, ...messages])
  if (type === 'success') {
    window.setTimeout(() => {
      ctx.flashMessages.update(messages => messages.filter(m => m.id !== id))
    }, 2000)
  }
}

// Remove a single flash message by its ID (used by the close button in Alert.js).
export function deleteFlashMessage(ctx, id) {
  ctx.flashMessages.update(messages => messages.filter(m => m.id !== id))
}
