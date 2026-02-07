export class AdminService {
  static async getUsers() {
    return { data: [], error: null };
  }

  static async getBlogs() {
    return { data: [], error: null };
  }

  static async updateBlog(id: string, data: any) {
    return { data: null, error: null };
  }

  static async deleteBlog(id: string) {
    return { data: null, error: null };
  }

  static async getAnalytics() {
    return { data: {}, error: null };
  }

  static async checkAdminAccess(userId: string) {
    return { hasAccess: true, isAdmin: true, error: null };
  }
}
