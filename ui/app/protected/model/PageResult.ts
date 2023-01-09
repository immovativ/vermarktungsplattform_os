export interface PageResult<T> {
    items: T[],
    total: number,
    page: number,
    limit: number
}
