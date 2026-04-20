import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'
import { route } from 'ziggy-js'

// Expose route() globally so all pages can use it without importing
// Pass window.Ziggy as 4th arg (config) so route().current() works correctly
window.route = (name, params, absolute, config) =>
    route(name, params, absolute, config ?? window.Ziggy)

createInertiaApp({
    resolve: name => {
        const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true })
        return pages[`./Pages/${name}.jsx`]
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />)
    },
})
