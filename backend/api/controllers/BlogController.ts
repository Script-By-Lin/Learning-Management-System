import { blogService } from '../../services/business/BlogService';
import { Role } from '../../shared/constants/roles';

export class BlogController {
  /**
   * List all blog posts (Public)
   */
  async listBlogs() {
    try {
      const blogs = await blogService.getAllBlogs();
      return { success: true, data: blogs, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to list blog posts.' };
    }
  }

  /**
   * Create a new blog post (Admin only)
   */
  async createBlog(body: any, role: Role) {
    try {
      if (role !== Role.ADMIN) {
        return { success: false, data: null, error: 'Access denied: Only administrators can publish blog posts.' };
      }

      const { title, author, category } = body;
      if (!title || !title.trim()) {
        return { success: false, data: null, error: 'Title is required.' };
      }
      if (!author || !author.trim()) {
        return { success: false, data: null, error: 'Author is required.' };
      }
      if (!category || !category.trim()) {
        return { success: false, data: null, error: 'Category is required.' };
      }

      const blog = await blogService.createBlog({
        title: title.trim(),
        author: author.trim(),
        category: category.trim(),
      });

      return { success: true, data: blog, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to create blog post.' };
    }
  }
}

export const blogController = new BlogController();
export default blogController;
