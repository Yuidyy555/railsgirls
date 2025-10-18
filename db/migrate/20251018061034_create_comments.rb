class CreateComments < ActiveRecord::Migration[8.0]
  def change
    create_table :comments do |t|
      t.string :user_name
      t.text :body
      t.references :idea, null: false, foreign_key: true

      t.timestamps
    end
  end
end
