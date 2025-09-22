from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Owner(Base):
    __tablename__ = "owners"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    profiles: Mapped[list["Profile"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    farms: Mapped[list["Farm"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    paddocks: Mapped[list["Paddock"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    applications: Mapped[list["Application"]] = relationship(back_populates="owner", cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("owners.id", ondelete="CASCADE"), nullable=False
    )
    full_name: Mapped[str | None] = mapped_column(String, nullable=True)
    role: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    owner: Mapped[Owner] = relationship(back_populates="profiles")


class Farm(Base):
    __tablename__ = "farms"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("owners.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    owner: Mapped[Owner] = relationship(back_populates="farms")
    paddocks: Mapped[list["Paddock"]] = relationship(back_populates="farm", cascade="all, delete-orphan")


class Paddock(Base):
    __tablename__ = "paddocks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("owners.id", ondelete="CASCADE"), nullable=False
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    area_hectares: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    gps_latitude: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    gps_longitude: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    gps_accuracy_m: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    gps_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    owner: Mapped[Owner] = relationship(back_populates="paddocks")
    farm: Mapped[Farm] = relationship(back_populates="paddocks")
    application_links: Mapped[list["ApplicationPaddock"]] = relationship(
        back_populates="paddock", cascade="all, delete-orphan"
    )


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("owners.id", ondelete="CASCADE"), nullable=False
    )
    mix_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    operator_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finalized: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    water_source: Mapped[str | None] = mapped_column(String, nullable=True)
    wind_speed_ms: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    wind_direction_deg: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    temp_c: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    humidity_pct: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    owner: Mapped[Owner] = relationship(back_populates="applications")
    paddocks: Mapped[list["ApplicationPaddock"]] = relationship(
        back_populates="application", cascade="all, delete-orphan"
    )


class ApplicationPaddock(Base):
    __tablename__ = "application_paddocks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("owners.id", ondelete="CASCADE"), nullable=False
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False
    )
    paddock_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("paddocks.id", ondelete="CASCADE"), nullable=False
    )
    gps_latitude: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    gps_longitude: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    gps_accuracy_m: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    gps_captured_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    application: Mapped[Application] = relationship(back_populates="paddocks")
    paddock: Mapped[Paddock] = relationship(back_populates="application_links")


class BlynkStation(Base):
    __tablename__ = "blynk_stations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("owners.id", ondelete="CASCADE"), nullable=False
    )
    station_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str | None] = mapped_column(String, nullable=True)
    read_url: Mapped[str] = mapped_column(String, nullable=False)
    auth_token: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    owner: Mapped[Owner] = relationship()
