
export type CancelFunction = () => void

/**
 * Executes callback at a set interval (every `delay` milliseconds) when `element` is visible in the viewport.
 * @param  {HTMLElement}    element
 * @param  {()          =>      void}        callback 
 * @param  {number}         delay  
 * @return {CancelFunction}        
 */
export default function (element: HTMLElement, callback: () => void, delay: number): CancelFunction {
    var interval = null

    function handler () {
        let visible = isOnScreen(element)

        if (interval == null && visible) {
            interval = setInterval(callback, delay)
        }
        else if (interval != null && !visible) {
            clearInterval(interval)
            interval = null
        }
    }

    document.addEventListener("scroll", handler)

    handler()

    return () => {
        document.removeEventListener("scroll", handler)

        if (interval) {
            clearInterval(interval) }
    }
}

export function isOnScreen(el: HTMLElement) {
    let clientRect = el.getBoundingClientRect()
        
    let visibleTop = clientRect.top >= 0 && clientRect.top < window.innerHeight
    let visibleBottom = clientRect.bottom >= 0 && clientRect.bottom < window.innerHeight
    let visibleLeft = clientRect.left >= 0 && clientRect.left < window.innerWidth
    let visibleRight = clientRect.right >= 0 && clientRect.right < window.innerWidth

    // stretches across screen
    let visibleVertical = clientRect.top < 0 && clientRect.bottom > window.innerHeight
    let visibleHorizontal = clientRect.left < 0 && clientRect.right > window.innerWidth

    return (visibleLeft || visibleRight || visibleHorizontal) && (visibleTop || visibleBottom || visibleVertical)
}