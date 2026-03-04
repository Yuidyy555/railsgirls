class List < ApplicationRecord
  belongs_to :board
  has_many :cards, -> { order(:position) }, dependent: :destroy

  validates :name, presence: true

  scope :ordered, -> { order(:position) }
end

