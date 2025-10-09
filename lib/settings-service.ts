import Settings from "@/models/Settings";
import { connectToDatabase } from "@/lib/mongoose";

export class SettingsService {
  private static cache = new Map<string, { value: any; timestamp: number }>();
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get a setting value with caching
   */
  static async getSetting(key: string, defaultValue: any = null): Promise<any> {
    try {
      // Check cache first
      const cached = this.cache.get(key);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.value;
      }

      await connectToDatabase();
      const setting = await Settings.findOne({ key });

      const value = setting ? setting.value : defaultValue;

      // Cache the result
      this.cache.set(key, { value, timestamp: Date.now() });

      return value;
    } catch (error) {
      console.error(`Error fetching setting ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Set a setting value and clear cache
   */
  static async setSetting(
    key: string,
    value: any,
    description: string = "",
    category: string = "general",
    updatedBy: string = "system"
  ): Promise<void> {
    try {
      await connectToDatabase();

      await Settings.findOneAndUpdate(
        { key },
        {
          key,
          value,
          description,
          category,
          updatedAt: new Date(),
          updatedBy,
        },
        { upsert: true }
      );

      // Clear cache for this key
      this.cache.delete(key);

      console.log(
        `✅ [SETTINGS] Updated setting ${key} = ${value} by ${updatedBy}`
      );
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
      throw error;
    }
  }

  /**
   * Clear all cached settings
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get all settings for admin panel
   */
  static async getAllSettings(): Promise<any[]> {
    try {
      await connectToDatabase();
      const settings = await Settings.find({}).sort({ category: 1, key: 1 });
      return settings.map((setting) => ({
        key: setting.key,
        value: setting.value,
        description: setting.description,
        category: setting.category,
        updatedAt: setting.updatedAt,
        updatedBy: setting.updatedBy,
      }));
    } catch (error) {
      console.error("Error fetching all settings:", error);
      return [];
    }
  }
}
