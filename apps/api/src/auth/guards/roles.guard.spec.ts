import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function contextWith(user: unknown, roles: unknown) {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(roles),
  } as unknown as Reflector;
  const guard = new RolesGuard(reflector);
  const ctx = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as never;
  return guard.canActivate(ctx);
}

describe('RolesGuard', () => {
  it('deja pasar sin @Roles', () => {
    expect(contextWith({ role: 'customer' }, undefined)).toBe(true);
  });

  it('rechaza sin sesión cuando hay @Roles', () => {
    expect(() => contextWith(undefined, ['admin'])).toThrow(
      UnauthorizedException,
    );
  });

  it('prohíbe customer en ruta admin', () => {
    expect(() => contextWith({ role: 'customer' }, ['admin'])).toThrow(
      ForbiddenException,
    );
  });

  it('permite admin en ruta admin', () => {
    expect(contextWith({ role: 'admin' }, ['admin'])).toBe(true);
  });
});
