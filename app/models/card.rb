class Card < ApplicationRecord
  belongs_to :list

  validates :title, presence: true

  scope :ordered, -> { order(:position) }
end


