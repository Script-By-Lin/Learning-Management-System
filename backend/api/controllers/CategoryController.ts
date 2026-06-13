import { categoryRepository } from '../../repositories/CategoryRepository';
import { Role } from '../../shared/constants/roles';

export class CategoryController {
  /**
   * List all categories
   */
  async listCategories() {
    try {
      const categories = await categoryRepository.findAll();
      return { success: true, data: categories, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to list categories.' };
    }
  }

  /**
   * Create a new category (Admin only)
   */
  async createCategory(body: any, role: Role) {
    try {
      if (role !== Role.ADMIN) {
        return { success: false, data: null, error: 'Access denied: Only administrators can create categories.' };
      }

      const { name } = body;
      if (!name || !name.trim()) {
        return { success: false, data: null, error: 'Category name is required.' };
      }

      const category = await categoryRepository.create(name.trim());
      return { success: true, data: category, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to create category.' };
    }
  }

  /**
   * Delete a category (Admin only)
   */
  async deleteCategory(id: string, role: Role) {
    try {
      if (role !== Role.ADMIN) {
        return { success: false, data: null, error: 'Access denied: Only administrators can delete categories.' };
      }

      if (!id) {
        return { success: false, data: null, error: 'Category ID is required.' };
      }

      const category = await categoryRepository.delete(id);
      return { success: true, data: category, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to delete category.' };
    }
  }
}

export const categoryController = new CategoryController();
export default categoryController;
