import { blogRepository, Blog, CreateBlogInput } from '../../repositories/BlogRepository';

export class BlogService {
  async getAllBlogs(): Promise<Blog[]> {
    return blogRepository.findAll();
  }

  async createBlog(data: CreateBlogInput): Promise<Blog> {
    if (!data.title || !data.author || !data.category) {
      throw new Error('Title, author, and category are required.');
    }
    return blogRepository.create(data);
  }
}

export const blogService = new BlogService();
export default blogService;
